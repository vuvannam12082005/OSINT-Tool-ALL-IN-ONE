import os
import sys
import glob
from time import time
from datetime import datetime
import typer
from rich import print as rprint
import matplotlib.pyplot as plt
import networkx as nx
import json

def create_graph_from_friends_data(data_dir):
    G = nx.DiGraph()
    
    json_files = glob.glob(os.path.join(data_dir, "*.json"))
    if not json_files:
        rprint(f"Không tìm thấy file dữ liệu nào trong thư mục {data_dir}")
        return None

    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                
                root_user = data.get("root_user") or data.get("account_id")
                if not root_user:
                    continue
                main_data = data.get("data", data)
                if not main_data:
                    continue
        
                G.add_node(root_user, label=root_user)
                
                process_friends_data(G, main_data, root_user)
                
            except json.JSONDecodeError:
                rprint(f"Không thể đọc file {json_file}")
                continue
    
    if len(G.nodes) == 0:
        rprint("Không có dữ liệu để vẽ đồ thị")
        return None

    plt.figure(figsize=(12, 10))
    pos = nx.spring_layout(G, k=0.3)
    labels = {node: G.nodes[node].get('label', node) for node in G.nodes()}
    nx.draw(G, pos, labels=labels, with_labels=True, node_size=800, 
            node_color='skyblue', font_size=8, font_weight='bold',
            edge_color='gray', width=0.5, arrows=True)
    
    plt.title(f"Đồ thị quan hệ bạn bè từ {data_dir}")
    plt.show()
    
    return G

def process_friends_data(G, data, parent_id):
    friends = data.get("friends", [])
    if not friends:
        return
    
    for friend in friends:
        friend_id = friend.get("username") or friend.get("uid") or friend.get("id")
        if not friend_id:
            continue
        
        friend_name = friend.get("name", friend_id)
        
        G.add_node(friend_id, label=friend_name)
        
        G.add_edge(parent_id, friend_id)
        
        friends_data = friend.get("friends_data")
        if friends_data:
            process_friends_data(G, friends_data, friend_id)

def main():
    data_dirs = glob.glob("friends_data_*")
    
    if not data_dirs:
        rprint("❌ Không tìm thấy thư mục dữ liệu nào có dạng friends_data_*")
        return
    
    rprint("[bold]Danh sách thư mục dữ liệu:[/bold]")
    for i, dir_name in enumerate(data_dirs, 1):
        json_files = glob.glob(os.path.join(dir_name, "*.json"))
        num_files = len(json_files)
        
        try:
            creation_time = os.path.getctime(dir_name)
            time_str = datetime.fromtimestamp(creation_time).strftime("%d/%m/%Y %H:%M:%S")
        except:
            time_str = "Không xác định"
            
        rprint(f"{i}. [bold]{dir_name}[/bold] - {num_files} file - Tạo lúc: {time_str}")
    
    choice = typer.prompt(
        "Chọn số thứ tự thư mục để vẽ đồ thị",
        type=int
    )
    
    if choice < 1 or choice > len(data_dirs):
        rprint("❌ Lựa chọn không hợp lệ")
        return
    
    selected_dir = data_dirs[choice - 1]
    rprint(f"Đang vẽ đồ thị từ dữ liệu trong thư mục [bold]{selected_dir}[/bold]...")
    
    time_start = time()
    graph = create_graph_from_friends_data(selected_dir)
    time_end = time()
    
    if graph:
        rprint(f"✅ Vẽ đồ thị thành công sau {time_end - time_start:.2f} giây")
        rprint(f"   - Số node: {len(graph.nodes())}")
        rprint(f"   - Số cạnh: {len(graph.edges())}")
    else:
        rprint("❌ Không thể vẽ đồ thị từ dữ liệu trong thư mục này")

if __name__ == "__main__":
    main()