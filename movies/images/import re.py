
import sys

input_file = "index_banner3.svg"  # 修改为你的文件路径
output_file = "index_banner.svg"

def remove_duplicate_attrs(line):
    # 定义需要去重的属性列表
    attrs_to_check = ['xlink:href', 'xmlns:xlink']
    
    for attr in attrs_to_check:
        # 分别尝试单引号和双引号
        for quote in ['"', "'"]:
            search_str = f'{attr}={quote}'
            pos = line.find(search_str)
            if pos == -1:
                continue
            
            # 找到第一个出现的位置后，扫描整行
            start_pos = pos
            # 找到这个属性的结束引号
            end_quote_pos = line.find(quote, pos + len(search_str))
            if end_quote_pos == -1:
                continue
            first_end = end_quote_pos + 1  # 第一个完整属性的结束位置
            
            # 从第一个属性后面开始，寻找是否还有相同的属性
            remaining = line[first_end:]
            next_pos = remaining.find(search_str)
            if next_pos != -1:
                print(f"发现重复的 {attr}，正在修复...")
                # 关键修复：只保留第一次出现的属性，将后面的全部删除
                # 但删除时必须注意，要连前面的空格一起删掉，避免留下双空格
                while next_pos != -1:
                    # 计算在整个line中的实际位置
                    actual_pos = first_end + next_pos
                    # 找到这个重复属性的结束引号
                    end = remaining.find(quote, next_pos + len(search_str))
                    if end == -1:
                        break
                    actual_end = first_end + end + 1
                    
                    # 检查前面是不是空格，如果是，把空格也删了
                    if line[actual_pos - 1] == ' ':
                        line = line[:actual_pos - 1] + line[actual_end:]
                    else:
                        line = line[:actual_pos] + line[actual_end:]
                    
                    # 重新在当前剩余部分找下一个重复
                    # 这里重置查找
                    remaining = line[first_end:]
                    next_pos = remaining.find(search_str)
    return line

# 读取文件（注意：如果文件不是UTF-8，改成 'gbk' 或 'latin-1'）
try:
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
except UnicodeDecodeError:
    # 如果UTF-8报错，使用二进制模式读取并强制解码
    with open(input_file, 'rb') as f:
        content = f.read().decode('latin-1')

# 由于是单行巨大，直接对整段文本操作
fixed_content = remove_duplicate_attrs(content)

# 写入修复后的文件
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print(f"修复完成，请打开 {output_file} 查看")