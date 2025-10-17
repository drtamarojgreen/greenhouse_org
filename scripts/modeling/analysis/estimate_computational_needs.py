def estimate_storage_requirements():
    print("\n--- Estimating Storage Requirements ---")
    human_neuron_count_billions = 86
    data_per_neuron_pb = 1.4 / 19000  # From 1.4 PB / 19,000 neurons
    total_neurons_human = human_neuron_count_billions * 1e9
    estimated_connectome_storage_pb = total_neurons_human * data_per_neuron_pb
    print(f"Estimated storage for full human brain connectome: {estimated_connectome_storage_pb:,.2f} PB")

def estimate_computing_space():
    print("\n--- Estimating Computing Space Requirements ---")
    print("Analysis of petabyte-scale data requires a distributed computing environment (HPC cluster with distributed storage like HDFS and processing like Spark).")

if __name__ == "__main__":
    estimate_storage_requirements()
    estimate_computing_space()
