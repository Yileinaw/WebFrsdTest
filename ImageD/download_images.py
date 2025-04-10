import requests
import os
import json

print("脚本已开始执行")

# --- 配置 ---
# 警告：直接将 API Key 写入代码不安全。更推荐使用环境变量。
# 但为了方便演示，这里使用 input 获取。
# ACCESS_KEY = input("请输入你的 Unsplash Access Key: ")
ACCESS_KEY = "LmLDSs24daoZZ2w-PqeI-bzGSQqGfjGAcIxrua-PUbg" # 使用用户提供的 Key
# 你想要搜索的关键词列表
# SEARCH_QUERIES = ["美食", "早餐", "烘焙", "晚餐", "水果", "蔬菜", "餐厅", "烹饪"] # Original list
SEARCH_QUERIES = [
    "gourmet food photography",  # 美食摄影 (更专业)
    "plated dish top view",     # 精致菜肴 俯视 (强调摆盘和角度)
    "home cooking flat lay",    # 家常菜谱 平铺构图
    "healthy breakfast bowl",   # 健康早餐 碗装
    "chocolate cake slice closeup", # 烘焙蛋糕 巧克力切块特写
    "fresh artisan bread",      # 新鲜 手工面包
    "steak dinner plating",     # 美味晚餐 牛排摆盘
    "vibrant fruit salad",      # 活力 水果沙拉
    "roasted vegetables dish",  # 烤蔬菜 料理
    "cozy restaurant interior", # 温馨 餐厅内景
    "cafe ambiance",            # 咖啡馆 氛围
    "chef cooking action",      # 厨师 烹饪动作
    "fresh ingredients macro",  # 新鲜 食材微距
    "tempting dessert display", # 诱人 甜点展示
    "ramen noodle bowl",       # 日式 拉面碗 (更具体的亚洲菜)
    "pasta carbonara plate"     # 意面 卡邦尼 (更具体的西餐)
]
# 每个关键词下载多少张图片
IMAGES_PER_QUERY = 5 # 注意 Unsplash API 的速率限制 (免费账户通常为 50 请求/小时)
# 图片保存的目录
OUTPUT_DIR = "downloaded_food_images"
# 图片质量 ('raw', 'full', 'regular', 'small', 'thumb') - regular 或 small 通常足够网页使用
IMAGE_QUALITY = 'regular'

# --- 函数：下载单张图片 ---
def download_image(url, filepath):
    """根据 URL 下载图片并保存到指定路径"""
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status() # 检查请求是否成功
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
        print(f"  成功下载: {filepath}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"  下载失败: {url} - 错误: {e}")
        return False
    except IOError as e:
        print(f"  保存文件失败: {filepath} - 错误: {e}")
        return False

# --- 主逻辑 ---
if __name__ == "__main__":
    print("进入主逻辑块")
    # 检查并创建输出目录
    if not os.path.exists(OUTPUT_DIR):
        try:
            os.makedirs(OUTPUT_DIR)
            print(f"创建目录: {OUTPUT_DIR}")
        except OSError as e:
            print(f"无法创建目录 {OUTPUT_DIR}: {e}")
            exit() # 如果无法创建目录，则退出

    headers = {
        "Accept-Version": "v1",
        "Authorization": f"Client-ID {ACCESS_KEY}"
    }
    api_url = "https://api.unsplash.com/search/photos"

    total_downloaded = 0

    # 遍历每个搜索关键词
    for query in SEARCH_QUERIES:
        print(f"\n正在搜索关键词: '{query}' (目标: {IMAGES_PER_QUERY} 张)")
        params = {
            "query": query,
            "per_page": IMAGES_PER_QUERY,
            "orientation": "landscape" # 可以设置为 'landscape', 'portrait', 'squarish' 或移除
        }

        try:
            response = requests.get(api_url, headers=headers, params=params)
            response.raise_for_status() # 检查 API 请求是否成功
            data = response.json()

            results = data.get('results', [])

            if not results:
                print(f"  未找到关键词 '{query}' 的图片。")
                continue

            print(f"  找到 {len(results)} 张图片，开始下载...")

            download_count_for_query = 0
            for img_data in results:
                if download_count_for_query >= IMAGES_PER_QUERY:
                    break # 确保不超过设定的数量

                image_url = img_data.get('urls', {}).get(IMAGE_QUALITY)
                image_id = img_data.get('id')

                if not image_url or not image_id:
                    print("  错误：图片数据中缺少 URL 或 ID。")
                    continue

                # 创建文件名 (避免特殊字符，使用 ID 保证唯一性)
                filename = f"{query.replace(' ', '_')}_{image_id}.jpg"
                filepath = os.path.join(OUTPUT_DIR, filename)

                # 下载图片
                if download_image(image_url, filepath):
                    download_count_for_query += 1
                    total_downloaded += 1

        except requests.exceptions.RequestException as e:
            print(f"  API 请求失败: {e}")
            # 如果是认证失败，提示检查 Key
            if response.status_code == 401:
                 print("  错误：请检查你的 Unsplash Access Key 是否正确。")
            elif response.status_code == 403:
                 print("  错误：API 访问被拒绝，可能已达到速率限制。请稍后再试。")

        except json.JSONDecodeError:
            print("  错误：解析 API 响应失败。")

    print(f"\n--- 下载完成 ---")
    print(f"总共成功下载 {total_downloaded} 张图片到目录 '{OUTPUT_DIR}'。")