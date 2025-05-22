#!/bin/bash

# Define the output directory for the JSON file
JSON_DIR="./json"
OUTPUT_FILE="${JSON_DIR}/system_stats.json"

# Ensure the output directory exists
mkdir -p "$JSON_DIR"

# Delete the existing JSON file if it exists
# The -f flag prevents errors if the file doesn't exist
rm -f "$OUTPUT_FILE"

# Function to get current timestamp
get_current_time() {
    date +"%Y-%m-%d %H:%M:%S"
}

# Function to get uptime
get_uptime() {
    local uptime_output_raw
    uptime_output_raw=$(uptime -p 2>/dev/null)
    if [ $? -eq 0 ]; then
        # Remove "up" prefix if present
        echo "$uptime_output_raw" | sed 's/^up //' | tr -d '\n'
    else
        echo ""
    fi
}

# Function to get IP address (simplified for primary interface, adjust if needed)
get_ip_address() {
    local ip_addr_raw
    ip_addr_raw=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [ $? -eq 0 ]; then
        echo "${ip_addr_raw}"
    else
        echo ""
    fi
}

# Function to get hostname
get_hostname() {
    local hostname_val_raw
    hostname_val_raw=$(hostname 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "${hostname_val_raw}"
    else
        echo ""
    fi
}

# Function to get OS information
get_os_info() {
    local os_info=""
    local os_info_raw

    # Try different commands to get OS info
    if [ -f /etc/os-release ]; then
        os_info_raw=$(grep PRETTY_NAME /etc/os-release 2>/dev/null | cut -d'=' -f2 | tr -d '"')
        if [ $? -eq 0 ]; then
            os_info="$os_info_raw"
        fi
    fi

    if [ -z "$os_info" ]; then # If os_info is still empty, try lsb_release
        if type lsb_release >/dev/null 2>&1; then
            os_info_raw=$(lsb_release -ds 2>/dev/null)
            if [ $? -eq 0 ]; then
                os_info="$os_info_raw"
            fi
        fi
    fi

    if [ -z "$os_info" ]; then # If os_info is still empty, fallback to uname
        os_info_raw=$(uname -s -r 2>/dev/null)
        if [ $? -eq 0 ]; then
            os_info="$os_info_raw"
        fi
    fi

    echo "${os_info}"
}

# Function to get CPU usage and core count
get_cpu_info() {
    local usage=""
    local cores=""
    local cpu_usage_raw
    local cpu_cores_raw

    # Get CPU usage percentage
    cpu_usage_raw=$(top -bn1 2>/dev/null | grep "Cpu(s)" | awk '{print $2}' | cut -d. -f1)
    if [[ $? -eq 0 && -n "$cpu_usage_raw" && "$cpu_usage_raw" =~ ^[0-9]+$ ]]; then
        usage="$cpu_usage_raw"
    fi

    # Get CPU core count
    cpu_cores_raw=$(nproc 2>/dev/null)
    if [[ $? -eq 0 && -n "$cpu_cores_raw" && "$cpu_cores_raw" =~ ^[0-9]+$ ]]; then
        cores="$cpu_cores_raw"
    fi

    # Return as JSON fragment
    echo "\"cpu\": {\"usage_percentage\": ${usage:-0}, \"cores\": ${cores:-0}}"
}

# Function to get memory info
get_memory_info() {
    local total=""
    local used=""
    local free=""
    local mem_info_raw

    mem_info_raw=$(free -g 2>/dev/null | awk '/Mem:/ {print $2, $3, $4}')
    if [[ $? -eq 0 && -n "$mem_info_raw" ]]; then
        read -r total_raw used_raw free_raw <<< "$mem_info_raw"
        total="${total_raw:-0}"
        used="${used_raw:-0}"
        free="${free_raw:-0}"
    fi

    echo "\"memory\": {\"total_gb\": ${total:-0}, \"used_gb\": ${used:-0}, \"free_gb\": ${free:-0}}"
}

# Function to get disk info
get_disk_info() {
    local total=""
    local used=""
    local available=""
    local usage=""
    local disk_raw

    disk_raw=$(df -h / 2>/dev/null | tail -1)
    if [ $? -eq 0 ] && [[ -n "$disk_raw" ]]; then
        # Use a regex-based approach for more robust parsing, especially with differing df outputs
        if [[ "$disk_raw" =~ ([0-9.]+)G\ *([0-9.]+)G\ *([0-9.]+)G\ *([0-9.]+)% ]]; then
            total=${BASH_REMATCH[1]}
            used=${BASH_REMATCH[2]}
            available=${BASH_REMATCH[3]}
            usage=${BASH_REMATCH[4]}
        fi
    fi

    echo "\"disk\": {\"total_gb\": ${total:-0}, \"used_gb\": ${used:-0}, \"available_gb\": ${available:-0}, \"usage_percentage\": ${usage:-0}}"
}

# Helper function to get a single service status
get_service_status() {
    local service_name=$1
    local status=""
    local systemctl_output_raw

    systemctl_output_raw=$(systemctl is-active "$service_name" 2>/dev/null)
    if [ $? -eq 0 ]; then # Command found and executed successfully
        case "$systemctl_output_raw" in
            active) status="active";;
            inactive) status="inactive";;
            failed) status="failed";;
            *) status="unknown";;
        esac
    else # systemctl failed, likely service not found or systemd not used
        status="not_found"
    fi
    echo "$status"
}

# Function to get statuses for all defined services
get_service_statuses() {
    local apache_status_raw
    local nginx_status_raw
    local mysql_status_raw
    local bind9_status_raw
    local dhcp_status_raw

    # Check for Apache (apache2 or httpd)
    apache_status_raw=$(get_service_status "apache2")
    if [ "$apache_status_raw" == "not_found" ]; then
        apache_status_raw=$(get_service_status "httpd")
    fi
    local apache_status="$apache_status_raw"

    # Assign each service status
    nginx_status_raw=$(get_service_status "nginx")
    local nginx_status="$nginx_status_raw"

    mysql_status_raw=$(get_service_status "mysql")
    local mysql_status="$mysql_status_raw"

    bind9_status_raw=$(get_service_status "bind9")
    local bind9_status="$bind9_status_raw"

    dhcp_status_raw=$(get_service_status "isc-dhcp-server")
    local dhcp_status="$dhcp_status_raw"

    echo "\"services\": {\"apache\": \"$apache_status\", \"nginx\": \"$nginx_status\", \"mysql\": \"$mysql_status\", \"bind9\": \"$bind9_status\", \"isc-dhcp-server\": \"$dhcp_status\"}"
}

# Function to get network traffic and latency
get_network_info() {
    local download_mbps=""
    local upload_mbps=""
    local latency_ms=""
    local vnstat_output_raw
    local latency_raw

    # Try to get network traffic using vnstat (placeholders for real-time Mbps)
    vnstat_output_raw=$(vnstat --oneline 2>/dev/null)
    if [ $? -eq 0 ] && [[ -n "$vnstat_output_raw" ]]; then
        # Placeholders. For real-time Mbps, you would need different tools or logic.
        download_mbps="0"
        upload_mbps="0"
    fi

    # Get latency (example using ping to google.com)
    latency_raw=$(ping -c 1 8.8.8.8 2>/dev/null | grep 'time=' | awk -F'time=' '{print $2}' | awk '{print $1}' | cut -d'.' -f1)
    if [[ $? -eq 0 && -n "$latency_raw" && "$latency_raw" =~ ^[0-9]+$ ]]; then
        latency_ms="$latency_raw"
    fi

    echo "\"network\": {\"download_mbps\": ${download_mbps:-0}, \"upload_mbps\": ${upload_mbps:-0}, \"latency_ms\": ${latency_ms:-0}}"
}

# Function to get temperature
get_temperature_celsius() {
    local temp=""
    local temp_raw

    # Common paths for temperature sensors
    if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
        temp_raw=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null)
        if [[ $? -eq 0 && -n "$temp_raw" && "$temp_raw" =~ ^[0-9]+$ ]]; then
            temp=$((temp_raw / 1000)) # Convert millidegrees Celsius to Celsius
        fi
    fi

    if [ -z "$temp" ]; then # If temp is still empty, try lm-sensors
        if type sensors >/dev/null 2>&1; then
            temp_raw=$(sensors 2>/dev/null | grep 'Package id 0:' | awk '{print $4}' | sed 's/+//' | sed 's/°C//' | cut -d'.' -f1)
            if [[ $? -eq 0 && -n "$temp_raw" && "$temp_raw" =~ ^[0-9]+$ ]]; then
                temp="$temp_raw"
            fi
        fi
    fi
    echo "${temp:-0}"
}


# Main function to generate the complete JSON
generate_full_json() {
    local current_time
    current_time=$(get_current_time)

    local uptime_val
    uptime_val=$(get_uptime)

    local ip_val
    ip_val=$(get_ip_address)

    local hostname_val
    hostname_val=$(get_hostname)

    local os_val
    os_val=$(get_os_info)

    local location_val="España, Barcelona" # Static as per your HTML/JS, make dynamic if needed

    local cpu_json_fragment
    cpu_json_fragment=$(get_cpu_info)

    local memory_json_fragment
    memory_json_fragment=$(get_memory_info)

    local disk_json_fragment
    disk_json_fragment=$(get_disk_info)

    local services_json_fragment
    services_json_fragment=$(get_service_statuses)

    local network_json_fragment
    network_json_fragment=$(get_network_info)

    local temperature_celsius_val
    temperature_celsius_val=$(get_temperature_celsius)

    cat <<EOF > "$OUTPUT_FILE"
{
  "execution_time": "$current_time",
  "uptime": "$uptime_val",
  "ip": "$ip_val",
  "hostname": "$hostname_val",
  "os": "$os_val",
  "location": "$location_val",
  $cpu_json_fragment,
  $memory_json_fragment,
  $disk_json_fragment,
  $services_json_fragment,
  $network_json_fragment,
  "temperature_celsius": $temperature_celsius_val
}
EOF

    echo "Generated system stats to $OUTPUT_FILE"
}

# Execute the main function
generate_full_json