from typing import List, Dict, Any
import os
import json
from time import sleep
from rich import print as rprint
from .account_friend import AccountFriend
from ...utils.save_to_json import SaveJSON
from datetime import datetime

class AccountFriendLayer:
    def __init__(self, user_id: str, max_layers: int, friends_per_layer: List[int]):
        self.user_id = user_id
        self.max_layers = max_layers
        self.friends_per_layer = friends_per_layer
        self.timestamp = datetime.now().strftime("%H%M%d%m%Y")
        self.base_dir = f"friends_data_{self.timestamp}"
        self.tree_data = {}

    def _ensure_directory_exists(self, path: str) -> None:
        if not os.path.exists(path):
            os.makedirs(path)

    def _save_friends_data(self, data: List[Dict[str, Any]], directory: str, filename: str) -> None:
        self._ensure_directory_exists(directory)
        file_path = os.path.join(directory, f"{filename}.json")

        account_info = {
            "account_id": filename,
            "profile_url": f"https://www.facebook.com/{filename}" if not filename.isdigit() else f"https://www.facebook.com/profile.php?id={filename}",
            "total_friends": len(data) if data else 0,
            "crawled_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "friends_data": data if data else [],
            "layer_info": {
                "current_layer": self.current_layer,
                "total_layers": self.max_layers,
                "friends_per_node": self.friends_per_layer[self.current_layer] if self.current_layer < len(self.friends_per_layer) else 0
            }
        }

        if not data:
            account_info["error"] = True
            account_info["message"] = "Không thể lấy được dữ liệu bạn bè"
        else:
            account_info["error"] = False
            account_info["message"] = "Lấy dữ liệu thành công"

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(account_info, f, ensure_ascii=False, indent=4)

        return account_info

    def _get_user_identifier(self, user_data: Dict[str, Any]) -> str:
        return user_data.get("username") or user_data.get("uid") or "unknown"

    def _crawl_layer(self, user_id: str, layer: int) -> List[Dict[str, Any]]:
        self.current_layer = layer
        max_friends = self.friends_per_layer[layer] if layer < len(self.friends_per_layer) else 0
        scraper = AccountFriend(user_id=user_id, max_friends=max_friends)
        scraper.pipeline()

        if not scraper.is_pipeline_successful:
            rprint(f"❌ Không thể crawl dữ liệu cho user {user_id} ở tầng {layer}")
            return []

        return scraper.extracted_data

    def _process_user_and_friends(self, user_id: str, layer: int, parent_path=None) -> Dict[str, Any]:
        if layer > self.max_layers:
            return None

        rprint(f"\n👤 Crawl dữ liệu của user {user_id} ở tầng {layer}")
        user_data = self._crawl_layer(user_id, layer)

        node_info = {
            "id": user_id,
            "profile_url": f"https://www.facebook.com/{user_id}" if not user_id.isdigit() else f"https://www.facebook.com/profile.php?id={user_id}",
            "layer": layer,
            "children": []
        }

        if not user_data:
            return node_info

        for idx, friend in enumerate(user_data[:self.friends_per_layer[layer] if layer < len(self.friends_per_layer) else 0]):
            friend_id = self._get_user_identifier(friend)
            if friend_id and friend_id != "unknown":
                friend_node = {
                    "id": friend_id,
                    "username": friend.get("username", ""),
                    "profile_url": f"https://www.facebook.com/{friend_id}" if not friend_id.isdigit() else f"https://www.facebook.com/profile.php?id={friend_id}",
                    "layer": layer + 1,
                    "children": []
                }
                if layer < self.max_layers - 1:
                    sleep(2)
                    friend_tree = self._process_user_and_friends(friend_id, layer + 1)
                    if friend_tree:
                        friend_node["children"] = friend_tree.get("children", [])

                elif layer == self.max_layers - 1:
                    sleep(2)
                    last_layer_friends = self._crawl_layer(friend_id, layer + 1)
                    if last_layer_friends:
                        for last_friend in last_layer_friends[:self.friends_per_layer[layer + 1] if (layer + 1) < len(self.friends_per_layer) else 0]:
                            last_friend_id = self._get_user_identifier(last_friend)
                            if last_friend_id and last_friend_id != "unknown":
                                friend_node["children"].append({
                                    "id": last_friend_id,
                                    "username": last_friend.get("username", ""),
                                    "profile_url": f"https://www.facebook.com/{last_friend_id}" if not last_friend_id.isdigit() else f"https://www.facebook.com/profile.php?id={last_friend_id}",
                                    "layer": layer + 2,
                                    "children": []
                                })

                node_info["children"].append(friend_node)

        return node_info

    def crawl(self) -> None:
        self._ensure_directory_exists(self.base_dir)
        rprint(f"🔍 Bắt đầu crawl dữ liệu cho user {self.user_id}")
        rprint(f"📊 Cấu hình crawl:")
        rprint(f"   - Số tầng tối đa: {self.max_layers}")
        rprint(f"   - Số bạn bè mỗi tầng: {self.friends_per_layer}")

        self.current_layer = 0

        tree_data = self._process_user_and_friends(self.user_id, 0)

        def count_nodes_excluding_root(node):
            """Đếm số node không bao gồm root node"""
            count = 0
            for child in node.get("children", []):
                count += 1  # Đếm child hiện tại
                count += count_nodes_excluding_root(child)  # Đếm recursively các child của child
            return count

        total_nodes = count_nodes_excluding_root(tree_data)

        result = {
            "root_user": self.user_id,
            "max_layers": self.max_layers,
            "crawled_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_accounts": total_nodes,
            "tree_data": tree_data
        }

        file_path = os.path.join(self.base_dir, f"{self.user_id}.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=4)

        # Phần thống kê cuối
        rprint(f"\n✅ Hoàn thành crawl dữ liệu!")
        rprint(f"📈 Thống kê:")

        # Tính toán chính xác số lượng tài khoản theo tầng (không tính ID gốc)
        layer_accounts = []  # Số tài khoản thực tế ở mỗi tầng
        
        # Tầng 0: số bạn bè lấy từ ID gốc
        accounts_layer_0 = self.friends_per_layer[0]
        layer_accounts.append(accounts_layer_0)
        rprint(f"   - Tầng 0: {accounts_layer_0} tài khoản (bạn bè của ID gốc)")
        
        # Tính số tài khoản cho các tầng tiếp theo
        for layer in range(1, self.max_layers + 1):
            if layer < len(self.friends_per_layer):
                # Từ mỗi tài khoản tầng trước lấy friends_per_layer[layer] bạn bè
                accounts_in_layer = layer_accounts[layer - 1] * self.friends_per_layer[layer]
                layer_accounts.append(accounts_in_layer)
                rprint(f"   - Tầng {layer}: {layer_accounts[layer - 1]} x {self.friends_per_layer[layer]} = {accounts_in_layer} tài khoản")

        total_expected_accounts = sum(layer_accounts)
        rprint(f"   - Tổng số tài khoản dự kiến: {total_expected_accounts}")
        rprint(f"   - Tổng số tài khoản đã crawl: {total_nodes}")
        rprint(f"   - Hiệu suất crawl: {(total_nodes/total_expected_accounts)*100:.1f}%")
        rprint(f"   - Thời gian crawl: {self.timestamp}")
        rprint(f"   - Dữ liệu đã được lưu tại: {file_path}")