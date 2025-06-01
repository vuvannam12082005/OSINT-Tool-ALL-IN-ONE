from typing import List, Dict
import re
import json
from time import sleep
import os

from rich import print as rprint
from selenium.webdriver.common.by import By

from ..facebook_base import BaseFacebookScraper
from ..scroll import scroll_page_callback
from ...logs import Logs
from ...repository import person_repository, friend_repository, crawlerqueue_repository
from ...utils import output

logs = Logs()


class AccountFriend(BaseFacebookScraper):
    def __init__(self, user_id: str, max_friends: int = None, crawler: bool = False) -> None:
        if user_id.isdigit():
            base_url = f"https://www.facebook.com/profile.php?id={user_id}&sk=friends"
        else:
            base_url = f"https://www.facebook.com/{user_id}/friends"

        super().__init__(user_id, base_url=base_url)
        self.success = False
        self.crawler = crawler
        self.max_friends = max_friends
        self.number_of_friends = 0
        self.extracted_data = []

    def _load_cookies_and_refresh_driver(self) -> None:
        self._load_cookies()
        sleep(3)
        self._driver.refresh()
        sleep(5)

    @property
    def is_pipeline_successful(self) -> bool:
        return self.success

    def _extract_uid_or_username(self, url: str) -> Dict[str, str]:
        uid_match = re.search(r"profile\.php\?id=(\d+)", url)
        if uid_match:
            return {"uid": uid_match.group(1)}
        
        username_match = re.search(r"facebook\.com/([\w\.]+)", url)
        if username_match:
            return {"username": username_match.group(1)}
        
        return {"username": "unknown"}

    def extract_friends_data(self) -> List[Dict[str, str]]:
        extracted_elements = []
        scroll_attempts = 0
        last_friend_count = 0
        no_new_friends_count = 0
        MAX_NO_NEW_FRIENDS = 3

        try:
            rprint("Đang thu thập danh sách bạn bè ban đầu...")
            main_div = self._driver.find_element(By.CSS_SELECTOR, "div.xyamay9.x1pi30zi.x1l90r2v.x1swvt13")
            elements = main_div.find_elements(By.CSS_SELECTOR, "a.x1i10hfl span")
            rprint(f"Tìm thấy {len(elements)} bạn bè")
            
            if elements:
                for element in elements:
                    if self.max_friends is not None and len(extracted_elements) >= self.max_friends:
                        rprint(f"Đã đạt đủ số lượng bạn bè yêu cầu ({self.max_friends})")
                        break
                    try:
                        self._process_friend(element, extracted_elements)
                    except Exception as e:
                        logs.log_error(f"Lỗi khi thu thập thông tin bạn bè: {e}")
                        continue

            while self.max_friends is None or len(extracted_elements) < self.max_friends:
                scroll_attempts += 1
                rprint(f"\nLượt scroll thứ {scroll_attempts}")
                rprint(f"Số bạn bè đã thu thập: {len(extracted_elements)}")
                if self.max_friends:
                    rprint(f"Số bạn bè cần thu thập: {self.max_friends}")

                self._driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                sleep(3)

                main_div = self._driver.find_element(By.CSS_SELECTOR, "div.xyamay9.x1pi30zi.x1l90r2v.x1swvt13")
                elements = main_div.find_elements(By.CSS_SELECTOR, "a.x1i10hfl span")
                
                current_count = len(extracted_elements)
                for element in elements:
                    if self.max_friends is not None and len(extracted_elements) >= self.max_friends:
                        break
                    try:
                        self._process_friend(element, extracted_elements)
                    except Exception as e:
                        logs.log_error(f"Lỗi khi thu thập thông tin bạn bè: {e}")
                        continue

                if len(extracted_elements) == current_count:
                    no_new_friends_count += 1
                    rprint(f"Không tìm thấy bạn mới trong lượt scroll này ({no_new_friends_count}/{MAX_NO_NEW_FRIENDS})")
                    if no_new_friends_count >= MAX_NO_NEW_FRIENDS:
                        rprint("\nKhông tìm thấy thêm bạn mới sau nhiều lần scroll, dừng thu thập")
                        break
                else:
                    no_new_friends_count = 0
                    rprint(f"Tìm thấy {len(extracted_elements) - current_count} bạn mới")

        except Exception as e:
            logs.log_error(f"Lỗi khi thu thập danh sách bạn bè: {e}")
            rprint(f"Đã xảy ra lỗi: {e}")

        self.number_of_friends = len(extracted_elements)
        rprint(f"\nĐã thu thập được tổng cộng {self.number_of_friends} bạn bè")
        return extracted_elements

    def _process_friend(self, element, extracted_elements):
        username = element.text.strip()
        url = element.find_element(By.XPATH, "..").get_attribute("href")
        if username == "" or url is None:
            return

        uid_or_username = self._extract_uid_or_username(url)
        element_data = {
            "name": username,
            **uid_or_username,
            "url": url
        }

        if element_data not in extracted_elements:
            rprint(f"Extracted friend: {username} - {url}")
            extracted_elements.append(element_data)

    def save_to_json(self, data: List[Dict[str, str]]) -> None:
        try:
            with open("friends_data.json", "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
            rprint("[bold green]Saved data to friends_data.json[/bold green]")
        except Exception as e:
            logs.log_error(f"Error saving to JSON: {e}")
            rprint("[bold red]Failed to save friends_data.json[/bold red]")

    def save_to_json_in_folder(self, data: List[Dict[str, str]], folder: str, base_filename: str) -> None:
        os.makedirs(folder, exist_ok=True)
        existing_files = os.listdir(folder)
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
        output_path = os.path.join(folder, new_filename)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        rprint(f"[bold green]Saved data to {output_path}[/bold green]")

    def pipeline(self) -> None:
        try:
            rprint("[bold]Step 1 of 2 - Load cookies[/bold]")
            self._load_cookies_and_refresh_driver()

            rprint("[bold]Step 2 of 2 - Extracting friends data[/bold]")
            self.extracted_data = self.extract_friends_data()
            
            if not any(self.extracted_data):
                self.extracted_data = []
                output.print_no_data_info()
                self._driver.quit()
                self.success = False
            else:
                output.print_data_from_list_of_dict(self.extracted_data)

                if not person_repository.person_exists(self._user_id):
                    person_repository.create_person(self._user_id)

                person_id = person_repository.get_person(self._user_id).id

                for data in self.extracted_data:
                    if self.crawler:
                        if not crawlerqueue_repository.crawler_queue_exists(
                            data["url"]
                        ):
                            crawlerqueue_repository.create_crawler_queue(data["url"])

                    if not friend_repository.friend_exists(
                        person_id, data["name"], data["url"]
                    ):
                        friend_repository.create_friends(
                            data["name"], data["url"], person_id
                        )

                number_of_person_friends = friend_repository.get_number_of_friends(
                    person_id
                )
                person_repository.update_number_of_friends(
                    person_id, number_of_person_friends
                )
                if person_repository:
                    rprint("[bold green]Person table updated[/bold green]")
                else:
                    rprint("[bold red]Person table not updated[/bold red]")

                self._driver.quit()
                self.success = True

        except Exception as e:
            logs.log_error(f"An error occurred: {e}")
            rprint(f"An error occurred {e}")
            self.extracted_data = []
            self.success = False
            self._driver.quit()