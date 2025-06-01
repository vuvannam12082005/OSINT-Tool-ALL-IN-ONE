import os
import json
import glob
import sys
from time import sleep
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from rich import print as rprint
from typing import Dict, List, Any
import pickle
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import re

rprint("[bold cyan]Bắt đầu quá trình khởi tạo...[/bold cyan]")

current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
project_root = os.path.dirname(src_dir)
if src_dir not in sys.path:
    sys.path.append(src_dir)

try:
    from ..facebook_base import BaseFacebookScraper
except (ImportError, ValueError):
    from metaspy.src.facebook.facebook_base import BaseFacebookScraper

class CustomBaseFacebookScraper(BaseFacebookScraper):
    def __init__(self, user_id: str, base_url: str):
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--start-maximized')
        
        self._driver = webdriver.Chrome(options=chrome_options)
        super().__init__(user_id, base_url)

    def _find_cookie_file(self) -> str:
        possible_paths = [
            os.path.join(project_root, "cookies.json"),
            os.path.join(src_dir, "cookies.json"),
            os.path.join(current_dir, "cookies.json"),
            os.path.join(os.path.dirname(current_dir), "cookies.json"),
        ]
        
        for path in possible_paths:
            rprint(f"- {path}")
            if os.path.exists(path):
                rprint(f"[green]Tìm thấy file cookie tại: {path}[/green]")
                return path
        
        raise FileNotFoundError(f"Không tìm thấy file cookie ở các vị trí:\n" + "\n".join(f"- {p}" for p in possible_paths))

    def _load_cookies(self) -> None:
        try:
            self._driver.get("https://www.facebook.com")
            sleep(2)
            
            self._driver.delete_all_cookies()
            cookie_path = self._find_cookie_file()
            
            with open(cookie_path, "rb") as file:
                cookies = pickle.load(file)
                for cookie in cookies:
                    try:
                        self._driver.add_cookie(cookie)
                    except Exception as e:
                        rprint(f"[red]Lỗi khi thêm cookie: {e}[/red]")
            
            rprint("[green]Đã load cookies thành công[/green]")
            self._driver.refresh()
            sleep(2)

        except Exception as e:
            rprint(f"[red]Lỗi khi load cookies: {e}[/red]")
            raise

    def _load_cookies_and_refresh_driver(self) -> None:
        self._load_cookies()

class FacebookProfileCrawler(CustomBaseFacebookScraper):
    def __init__(self, user_id: str):
        self.user_id = user_id
        
        if user_id.isdigit():
            self.profile_url = f"https://www.facebook.com/profile.php?id={user_id}"
            base_url = self.profile_url
        else:
            self.profile_url = f"https://www.facebook.com/{user_id}"
            base_url = self.profile_url
            
        super().__init__(user_id, base_url)
        self.wait = WebDriverWait(self._driver, 10)

    def get_profile_picture(self):
        rprint("[cyan]→ Đang lấy ảnh đại diện...[/cyan]")
        try:
            avatar_element = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "image[preserveAspectRatio='xMidYMid slice']"))
            )
            url = avatar_element.get_attribute("xlink:href")
            rprint(f"[green]  ✓ Đã lấy được URL ảnh đại diện[/green]")
            return url
        except:
            rprint("[yellow]  ! Không lấy được link ảnh đại diện[/yellow]")
            return None

    def get_cover_photo(self):
        rprint("[cyan]→ Đang lấy ảnh bìa...[/cyan]")
        try:
            cover_element = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "img[data-imgperflogname='profileCoverPhoto']"))
            )
            url = cover_element.get_attribute("src")
            rprint(f"[green]  ✓ Đã lấy được URL ảnh bìa[/green]")
            return url
        except:
            rprint("[yellow]  ! Không lấy được link ảnh bìa[/yellow]")
            return None

    def get_followers_count(self):
        rprint("[cyan]→ Đang lấy số người theo dõi...[/cyan]")
        try:
            selectors = [
                "//a[contains(@href, '/followers')]//span[contains(@class, 'x193iq5w')]",
                "//a[contains(@href, '/followers')]//span[contains(@class, 'xt0psk2')]",
                "//div[contains(@class, 'x1lliihq')]//span[contains(text(), 'người theo dõi')]",
                "//div[contains(@class, 'x1lliihq')]//span[contains(text(), 'followers')]"
            ]
            
            for selector in selectors:
                try:
                    element = self._driver.find_element(By.XPATH, selector)
                    count_text = element.text.strip()
                    
                    count = ''.join(filter(lambda x: x.isdigit() or x in 'KMB,.', count_text))
                    if count:
                        rprint(f"[green]  ✓ Số người theo dõi: {count} (từ selector: {selector})[/green]")
                        return count
                except:
                    continue
                    
            all_elements = self._driver.find_elements(
                By.XPATH,
                "//span[contains(text(), 'người theo dõi') or contains(text(), 'followers')]"
            )
            for element in all_elements:
                count_text = element.text.strip()
                if any(char.isdigit() for char in count_text):
                    count = ''.join(filter(lambda x: x.isdigit() or x in 'KMB,.', count_text))
                    rprint(f"[green]  ✓ Số người theo dõi: {count} (từ text chứa 'người theo dõi')[/green]")
                    return count
                    
            rprint("[yellow]  ! Không tìm thấy số người theo dõi trong tất cả các selector[/yellow]")
            return "0"
        except Exception as e:
            rprint(f"[yellow]  ! Lỗi khi lấy số người theo dõi: {str(e)}[/yellow]")
            return "0"

    def get_friends_count(self):
        rprint("[cyan]→ Đang lấy số lượng bạn bè...[/cyan]")
        try:
            selectors = [
                "//a[contains(@href, '/friends')]//span[contains(@class, 'x193iq5w')]",
                "//a[contains(@href, '/friends')]//span[contains(@class, 'xt0psk2')]",
                "//div[contains(@class, 'x1lliihq')]//span[contains(text(), 'bạn bè')]",
                "//div[contains(@class, 'x1lliihq')]//span[contains(text(), 'friends')]"
            ]
            
            for selector in selectors:
                try:
                    element = self._driver.find_element(By.XPATH, selector)
                    count_text = element.text.strip()
                    
                    count = ''.join(filter(lambda x: x.isdigit() or x in 'KMB,.', count_text))
                    if count:
                        rprint(f"[green]  ✓ Số bạn bè: {count} (từ selector: {selector})[/green]")
                        return count
                except:
                    continue
                    
            all_elements = self._driver.find_elements(
                By.XPATH,
                "//span[contains(text(), 'bạn bè') or contains(text(), 'friends')]"
            )
            for element in all_elements:
                count_text = element.text.strip()
                if any(char.isdigit() for char in count_text):
                    count = ''.join(filter(lambda x: x.isdigit() or x in 'KMB,.', count_text))
                    rprint(f"[green]  ✓ Số bạn bè: {count} (từ text chứa 'bạn bè')[/green]")
                    return count
                    
            rprint("[yellow]  ! Không tìm thấy số bạn bè trong tất cả các selector[/yellow]")
            return "0"
        except Exception as e:
            rprint(f"[yellow]  ! Lỗi khi lấy số bạn bè: {str(e)}[/yellow]")
            return "0"

    def get_bio(self):
        rprint("[cyan]→ Đang lấy tiểu sử...[/cyan]")
        try:
            bio_selectors = [
                "//div[contains(@class, 'x1heor9g')]//div[contains(text(), 'Giới thiệu')]/..",
                "//div[contains(@class, 'x1heor9g')]//div[contains(text(), 'Bio')]/..",
                "//div[contains(@class, 'xyamay9')]//div[contains(text(), 'Giới thiệu')]/..",
                "//div[contains(@class, 'x1cy8zhl')]//div[contains(text(), 'Giới thiệu')]/.."
            ]
            
            for selector in bio_selectors:
                try:
                    bio_element = self._driver.find_element(By.XPATH, selector)
                    bio_text = bio_element.text.strip()
                    if bio_text and "Giới thiệu" in bio_text:
                        rprint(f"[green]  ✓ Đã lấy được tiểu sử từ trang profile: {bio_text}[/green]")
                        return bio_text
                except:
                    continue

            rprint("[cyan]  → Thử tìm trong trang about...[/cyan]")
            about_url = f"{self.profile_url}/about" if not self.user_id.isdigit() else f"{self.profile_url}&sk=about"
            rprint(f"[blue]  - Truy cập: {about_url}[/blue]")
            self._driver.get(about_url)
            sleep(1)
            
            about_selectors = [
                "//div[contains(@class, 'x1heor9g')]//div[contains(text(), 'Tiểu sử')]/following-sibling::div",
                "//div[contains(@class, 'xyamay9')]//div[contains(text(), 'Tiểu sử')]/following-sibling::div",
                "//div[contains(@class, 'x1cy8zhl')]//div[contains(text(), 'Tiểu sử')]/following-sibling::div",
                "//div[contains(text(), 'Bio')]/following-sibling::div"
            ]
            
            for selector in about_selectors:
                try:
                    bio_element = self._driver.find_element(By.XPATH, selector)
                    bio_text = bio_element.text.strip()
                    if bio_text:
                        rprint(f"[green]  ✓ Đã lấy được tiểu sử từ trang about: {bio_text}[/green]")
                        return bio_text
                except:
                    continue
                    
            rprint("[yellow]  ! Không tìm thấy tiểu sử[/yellow]")
            return ""
        except Exception as e:
            rprint(f"[yellow]  ! Lỗi khi lấy tiểu sử: {str(e)}[/yellow]")
            return ""

    def get_about_info(self, about_sections):
        about_data = {}
        
        for section in about_sections:
            try:
                rprint(f"\n[bold cyan]→ Đang crawl section: {section}[/bold cyan]")
                
                if self.user_id.isdigit():
                    url = f"{self.profile_url}&sk={section}"
                else:
                    url = f"{self.profile_url}/{section}"
                    
                rprint(f"[blue]  - Truy cập: {url}[/blue]")
                self._driver.get(url)
                sleep(1)
                
                section_data = {
                    "title": "",
                    "url": url,
                    "content": {}
                }
                
                try:
                    title_element = self.wait.until(
                        EC.presence_of_element_located((By.XPATH, "//span[contains(@class, 'x193iq5w') and contains(@class, 'xeuugli')]"))
                    )
                    section_data["title"] = title_element.text.strip()
                    rprint(f"[green]  ✓ Tiêu đề section: {section_data['title']}[/green]")
                except:
                    section_data["title"] = section.replace("about_", "").replace("_", " ").title()
                    rprint(f"[yellow]  ! Sử dụng tiêu đề mặc định: {section_data['title']}[/yellow]")

                content_elements = self._driver.find_elements(
                    By.XPATH,
                    "//div[contains(@class, 'x1hq5gj4') or contains(@class, 'x1gan7if')]//span[contains(@class, 'x193iq5w')]"
                )
                
                rprint(f"[blue]  - Tìm thấy {len(content_elements)} phần tử chứa thông tin[/blue]")
                
                current_category = None
                for element in content_elements:
                    text = element.text.strip()
                    if not text:
                        continue
                        
                    if element.get_attribute("role") == "heading" or text.endswith(":"):
                        current_category = text.rstrip(":")
                        if current_category not in section_data["content"]:
                            section_data["content"][current_category] = []
                            rprint(f"[blue]    + Category: {current_category}[/blue]")
                    elif current_category:
                        if text not in ["Xem thêm", "Ẩn bớt"]:
                            section_data["content"][current_category].append(text)
                            rprint(f"[cyan]      · {text}[/cyan]")
                    else:
                        if "general" not in section_data["content"]:
                            section_data["content"]["general"] = []
                        if text not in ["Xem thêm", "Ẩn bớt"]:
                            section_data["content"]["general"].append(text)
                            rprint(f"[cyan]      · {text}[/cyan]")
                
                about_data[section] = section_data
                rprint(f"[green]  ✓ Hoàn thành crawl section: {section}[/green]")
                
            except Exception as e:
                rprint(f"[red]  ! Lỗi khi crawl section {section}: {str(e)}[/red]")
                about_data[section] = {
                    "title": section.replace("about_", "").replace("_", " ").title(),
                    "url": url,
                    "content": {"error": str(e)}
                }
            
            sleep(1)
        
        return about_data

    def crawl_profile(self):
        data = {}
        
        try:
            rprint("[bold]Step 1 of 3 - Load cookies[/bold]")
            self._load_cookies_and_refresh_driver()
            
            rprint("\n[bold]Step 2 of 3 - Lấy thông tin cơ bản[/bold]")
            rprint(f"[blue]→ Truy cập profile: {self.profile_url}[/blue]")
            self._driver.get(self.profile_url)
            sleep(2)
            
            rprint("\n[cyan]→ Thu thập thông tin cơ bản...[/cyan]")
            data['profile_picture'] = self.get_profile_picture()
            data['cover_photo'] = self.get_cover_photo()
            data['followers_count'] = self.get_followers_count()
            data['friends_count'] = self.get_friends_count()
    
            
            data['bio'] = self.get_bio()
            
            rprint("\n[bold]Step 3 of 3 - Crawl thông tin about[/bold]")
            about_sections = [
                'about',
                'about_work_and_education',
                'about_places',
                'about_contact_and_basic_info',
                'about_privacy_and_legal_info',
                'about_profile_transparency',
                'about_family_and_relationships',
                'about_details',
                'about_life_events'
            ]
            
            data['about_info'] = self.get_about_info(about_sections)
            
            rprint("\n[bold green]✓ Đã hoàn thành crawl profile![/bold green]")
            return data
            
        except Exception as e:
            rprint(f"[red]! Lỗi khi crawl profile: {e}[/red]")
            raise
        finally:
            self._driver.quit()

def get_friends_data_folders():
    friends_data_folders = []
    
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    
    for root, dirs, _ in os.walk(project_root):
        matching_dirs = [d for d in dirs if d.startswith('friends_data_')]
        for dir_name in matching_dirs:
            full_path = os.path.join(root, dir_name)
            relative_path = os.path.relpath(full_path, os.getcwd())
            friends_data_folders.append(relative_path)
    
    return friends_data_folders

def select_folder(folders):
    if not folders:
        rprint("[red]Không tìm thấy thư mục friends_data_* nào trong dự án[/red]")
        return None
        
    rprint("\n[bold]Danh sách thư mục friends_data_* có sẵn:[/bold]")
    for idx, folder in enumerate(folders, 1):
        rprint(f"{idx}. {folder}")
    
    while True:
        try:
            choice = int(input("\nChọn số thứ tự thư mục (1-{}): ".format(len(folders))))
            if 1 <= choice <= len(folders):
                selected = folders[choice - 1]
                rprint(f"[green]Đã chọn: {selected}[/green]")
                return selected
            rprint("[yellow]Vui lòng chọn số từ 1 đến[/yellow]", len(folders))
        except ValueError:
            rprint("[yellow]Vui lòng nhập một số hợp lệ[/yellow]")

def get_json_files(folder):
    return glob.glob(os.path.join(folder, "*.json"))

def collect_profile_ids(tree_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    profiles = []
    
    def traverse_tree(node: Dict[str, Any]):
        if not isinstance(node, dict) or not node:
            rprint("[yellow]Bỏ qua node không hợp lệ[/yellow]")
            return
            
        if "id" in node:
            profile_info = {
                "id": node["id"],
                "profile_url": node.get("profile_url", ""),
                "layer": node.get("layer", 0),
                "relationship_mark": node.get("relationship_mark", "root")
            }
            profiles.append(profile_info)
            rprint(f"[green]Đã thu thập thông tin profile: {profile_info['id']} (Layer: {profile_info['layer']})[/green]")
        
        children = node.get("children", [])
        if isinstance(children, list):
            rprint(f"[cyan]Duyệt qua {len(children)} node con[/cyan]")
            for child in children:
                traverse_tree(child)
    
    if not isinstance(tree_data, dict) or "tree_data" not in tree_data:
        rprint("[red]Cấu trúc dữ liệu không hợp lệ: Thiếu key 'tree_data'[/red]")
        return []
        
    rprint("\n[bold]Bắt đầu duyệt cây dữ liệu[/bold]")
    traverse_tree(tree_data["tree_data"])
    rprint(f"[bold green]Đã thu thập xong {len(profiles)} profiles[/bold green]")
    return profiles

def read_json_file(json_file):
    with open(json_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(crawled_data: Dict[str, Any], original_data: Dict[str, Any], output_folder: str, base_filename: str):
    rprint("\n[bold]Bắt đầu quá trình lưu dữ liệu[/bold]")

    def update_tree_data(node: Dict[str, Any]):
        if not isinstance(node, dict) or not node:
            rprint("[yellow]Bỏ qua node không hợp lệ[/yellow]")
            return

        if "id" in node:
            node_id = node["id"]
            if node_id in crawled_data:
                node.update(crawled_data[node_id])
                rprint(f"[green]Đã cập nhật dữ liệu cho node: {node_id}[/green]")

        children = node.get("children", [])
        if isinstance(children, list):
            rprint(f"[cyan]Cập nhật {len(children)} node con[/cyan]")
            for child in children:
                update_tree_data(child)

    if not isinstance(original_data, dict) or "tree_data" not in original_data:
        rprint("[red]Cấu trúc dữ liệu gốc không hợp lệ: Thiếu key 'tree_data'[/red]")
        return

    rprint("\n[bold]Bắt đầu cập nhật dữ liệu vào cây[/bold]")
    update_tree_data(original_data["tree_data"])

    # Lấy max_layers và friends_per_layer từ original_data, nếu thiếu thì báo lỗi
    try:
        max_layers = original_data['max_layers']
        friends_per_layer = original_data['friends_per_layer']
    except KeyError as e:
        raise ValueError(f"Thiếu trường {e} trong dữ liệu gốc, không thể lưu file chuẩn hóa!")

    tree_data = original_data["tree_data"]
    normalized_data = {
        'root_user': original_data.get('root_user', tree_data.get('id', '')),
        'max_layers': max_layers,
        'friends_per_layer': friends_per_layer,
        'crawled_at': original_data.get('crawled_at', ''),
        'total_accounts': original_data.get('total_accounts', 0),
        'tree_data': tree_data
    }

    # Đảm bảo thư mục đã chọn tồn tại
    os.makedirs(output_folder, exist_ok=True)

    # Sinh tên file mới data_{count}_{base_filename}
    existing_files = os.listdir(output_folder)
    pattern = re.compile(r'data_(\d+)_' + re.escape(base_filename))
    max_idx = -1
    for fname in existing_files:
        m = pattern.match(fname)
        if m:
            idx = int(m.group(1))
            if idx > max_idx:
                max_idx = idx
    new_idx = max_idx + 1
    new_filename = f"data_{new_idx}_{base_filename}"
    output_path = os.path.join(output_folder, new_filename)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(normalized_data, f, ensure_ascii=False, indent=2)

    rprint(f"\n[bold green]Đã lưu dữ liệu thành công vào {output_path}[/bold green]")

def main():
    rprint("[bold cyan]Bắt đầu chương trình chính...[/bold cyan]")
    
    rprint("[bold]Bước 1: Tìm kiếm thư mục friends_data_*[/bold]")
    folders = get_friends_data_folders()
    if not folders:
        print("Không tìm thấy thư mục friends_data_*")
        return
    
    rprint("[bold]Bước 2: Chọn thư mục để xử lý[/bold]")
    selected_folder = select_folder(folders)
    if not selected_folder:
        return
    
    rprint("[bold]Bước 3: Tìm kiếm file JSON trong thư mục đã chọn[/bold]")
    json_files = get_json_files(selected_folder)
    if not json_files:
        print(f"Không tìm thấy file JSON trong thư mục {selected_folder}")
        return
    
    rprint("[bold]Bước 4: Đọc dữ liệu từ file JSON[/bold]")
    json_data = read_json_file(json_files[0])
    
    rprint("[bold]Bước 5: Thu thập thông tin profile từ dữ liệu JSON[/bold]")
    profiles = collect_profile_ids(json_data)
    
    profiles.sort(key=lambda x: x["layer"])
    
    rprint("\n[bold]Thông tin crawl:[/bold]")
    rprint(f"Tổng số profile cần crawl: {len(profiles)}")
    for layer in range(max(p["layer"] for p in profiles) + 1):
        layer_profiles = [p for p in profiles if p["layer"] == layer]
        rprint(f"Tầng {layer}: {len(layer_profiles)} profile")
    
    rprint("[bold]Bước 6: Bắt đầu quá trình crawl dữ liệu[/bold]")
    crawled_data = {}
    for profile in profiles:
        profile_id = profile["id"]
        rprint(f"\n[bold]Đang crawl profile {profile_id}[/bold]")
        rprint(f"Layer: {profile['layer']}")
        rprint(f"Relationship mark: {profile['relationship_mark']}")
        
        try:
            crawler = FacebookProfileCrawler(profile_id)
            profile_data = crawler.crawl_profile()
            profile_data["layer"] = profile["layer"]
            profile_data["relationship_mark"] = profile["relationship_mark"]
            crawled_data[profile_id] = profile_data
        except Exception as e:
            rprint(f"[red]Lỗi khi crawl profile {profile_id}: {e}[/red]")
            crawled_data[profile_id] = {
                "error": str(e),
                "layer": profile["layer"],
                "relationship_mark": profile["relationship_mark"]
            }
        
        sleep(1)
    
    rprint("[bold]Bước 7: Lưu dữ liệu đã crawl[/bold]")
    output_folder = selected_folder
    filename = os.path.basename(json_files[0])
    save_data(crawled_data, json_data, output_folder, filename)

    rprint("[bold green]Chương trình đã hoàn thành![bold green]")

if __name__ == "__main__":
    main()