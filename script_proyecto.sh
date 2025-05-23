#!/bin/bash


JSON_DIR="./json"
OUTPUT_FILE="${JSON_DIR}/system_stats.json"

mkdir -p "$JSON_DIR"

rm -f "$OUTPUT_FILE"


get_current_time() {
    date +"%Y-%m-%d %H:%M:%S"
}


get_uptime() {
    local uptime_output_raw
    uptime_output_raw=$(uptime -p 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "$uptime_output_raw" | sed 's/^up //' | tr -d '\n'
    else
        echo ""
    fi
}


get_ip_address() {
    local ip_addr_raw
    ip_addr_raw=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [ $? -eq 0 ]; then
        echo "${ip_addr_raw}"
    else
        echo ""
    fi
}

get_hostname() {
    local hostname_val_raw
    hostname_val_raw=$(hostname 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "${hostname_val_raw}"
    else
        echo ""
    fi
}


get_os_info() {
    local os_info=""
    local os_info_raw


    if [ -f /etc/os-release ]; then
        os_info_raw=$(grep PRETTY_NAME /etc/os-release 2>/dev/null | cut -d'=' -f2 | tr -d '"')
        if [ $? -eq 0 ]; then
            os_info="$os_info_raw"
        fi
    fi

    if [ -z "$os_info" ]; then
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


get_cpu_info() {
    local usage=""
    local cores=""
    local cpu_usage_raw
    local cpu_cores_raw


    cpu_usage_raw=$(top -bn1 2>/dev/null | grep "Cpu(s)" | awk '{print $2}' | cut -d. -f1)
    if [[ $? -eq 0 && -n "$cpu_usage_raw" && "$cpu_usage_raw" =~ ^[0-9]+$ ]]; then
        usage="$cpu_usage_raw"
    fi

 
    cpu_cores_raw=$(nproc 2>/dev/null)
    if [[ $? -eq 0 && -n "$cpu_cores_raw" && "$cpu_cores_raw" =~ ^[0-9]+$ ]]; then
        cores="$cpu_cores_raw"
    fi


    echo "\"cpu\": {\"usage_percentage\": ${usage:-0}, \"cores\": ${cores:-0}}"
}


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


get_disk_info() {
    local total=""
    local used=""
    local available=""
    local usage=""
    local disk_raw

    disk_raw=$(df -h / 2>/dev/null | tail -1)
    if [ $? -eq 0 ] && [[ -n "$disk_raw" ]]; then

        if [[ "$disk_raw" =~ ([0-9.]+)G\ *([0-9.]+)G\ *([0-9.]+)G\ *([0-9.]+)% ]]; then
            total=${BASH_REMATCH[1]}
            used=${BASH_REMATCH[2]}
            available=${BASH_REMATCH[3]}
            usage=${BASH_REMATCH[4]}
        fi
    fi

    echo "\"disk\": {\"total_gb\": ${total:-0}, \"used_gb\": ${used:-0}, \"available_gb\": ${available:-0}, \"usage_percentage\": ${usage:-0}}"
}


get_service_status() {
    local service_name=$1
    local status=""
    local systemctl_output_raw

    systemctl_output_raw=$(systemctl is-active "$service_name" 2>/dev/null)
    if [ $? -eq 0 ]; then 
        case "$systemctl_output_raw" in
            active) status="active";;
            inactive) status="inactive";;
            failed) status="failed";;
            *) status="unknown";;
        esac
    else 
        status="not_found"
    fi
    echo "$status"
}

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

get_network_info() {
    local download_mbps=""
    local upload_mbps=""
    local latency_ms=""
    local vnstat_output_raw
    local latency_raw


    vnstat_output_raw=$(vnstat --oneline 2>/dev/null)
    if [ $? -eq 0 ] && [[ -n "$vnstat_output_raw" ]]; then
        download_mbps="0"
        upload_mbps="0"
    fi


    latency_raw=$(ping -c 1 8.8.8.8 2>/dev/null | grep 'time=' | awk -F'time=' '{print $2}' | awk '{print $1}' | cut -d'.' -f1)
    if [[ $? -eq 0 && -n "$latency_raw" && "$latency_raw" =~ ^[0-9]+$ ]]; then
        latency_ms="$latency_raw"
    fi

    echo "\"network\": {\"download_mbps\": ${download_mbps:-0}, \"upload_mbps\": ${upload_mbps:-0}, \"latency_ms\": ${latency_ms:-0}}"
}


get_temperature_celsius() {
    local temp=""
    local temp_raw


    if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
        temp_raw=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null)
        if [[ $? -eq 0 && -n "$temp_raw" && "$temp_raw" =~ ^[0-9]+$ ]]; then
            temp=$((temp_raw / 1000))
        fi
    fi

    if [ -z "$temp" ]; then 
        if type sensors >/dev/null 2>&1; then
            temp_raw=$(sensors 2>/dev/null | grep 'Package id 0:' | awk '{print $4}' | sed 's/+//' | sed 's/°C//' | cut -d'.' -f1)
            if [[ $? -eq 0 && -n "$temp_raw" && "$temp_raw" =~ ^[0-9]+$ ]]; then
                temp="$temp_raw"
            fi
        fi
    fi
    echo "${temp:-0}"
}


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

    local location_val="España, Barcelona"

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