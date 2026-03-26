import os
import time
import psutil
import datetime

def get_resource_usage():
    cpu = psutil.cpu_percent(interval=1)
    ram = psutil.virtual_memory().percent
    load = os.getloadavg()
    return cpu, ram, load

def monitor_process(duration_seconds=60, interval=2, output_file="renders/resource_log.txt"):
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, "a") as f:
        f.write(f"\n--- Monitoring Started: {datetime.datetime.now()} ---\n")
        f.write("Time, CPU%, RAM%, Load1, Load5, Load15\n")
        
        start_time = time.time()
        while time.time() - start_time < duration_seconds:
            cpu, ram, load = get_resource_usage()
            timestamp = datetime.datetime.now().strftime("%H:%M:%S")
            log_line = f"{timestamp}, {cpu}, {ram}, {load[0]}, {load[1]}, {load[2]}"
            f.write(log_line + "\n")
            f.flush()
            time.sleep(interval)
        
        f.write(f"--- Monitoring Stopped: {datetime.datetime.now()} ---\n")

if __name__ == "__main__":
    monitor_process(duration_seconds=300)
