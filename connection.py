import mysql.connector
from mysql.connector import Error

def connect_to_database():
    try:
        connection = mysql.connector.connect(
            host="localhost",      # 数据库主机地址
            port=3306,            # 端口号（默认3306）
            user="root",          # 数据库用户名
            password="120NKu418Szl,",  # 数据库密码
            database="mybbs"       # 数据库名称
        )
        if connection.is_connected():
            print("成功连接到数据库！")
            return connection
    except Error as e:
        print(f"连接失败: {e}")
        return None

# 测试查询
def test_query():
    connection = connect_to_database()
    if connection:
        cursor = connection.cursor()
        try:
            cursor.execute("SELECT * FROM users")
            result = cursor.fetchall()
            print("查询结果:", result)
        except Error as e:
            print(f"查询失败: {e}")
        finally:
            cursor.close()
            connection.close()

if __name__ == "__main__":
    test_query()