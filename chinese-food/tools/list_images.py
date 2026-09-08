import json, sys, time, urllib.parse, urllib.request, ssl

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

UA = 'ChinaFoodCourseSite/1.0 (educational course project; built with urllib)'
API = 'https://commons.wikimedia.org/w/api.php'
PROXY = 'http://127.0.0.1:7890'

def opener():
    proxy = urllib.request.ProxyHandler({'http': PROXY, 'https': PROXY})
    ctx = ssl.create_default_context()
    return urllib.request.build_opener(proxy, urllib.request.HTTPSHandler(context=ctx))

def search(op, query, limit=8, tries=3):
    params = {
        'action': 'query', 'generator': 'search', 'gsrnamespace': '6',
        'gsrsearch': query, 'gsrlimit': str(limit), 'format': 'json',
        'prop': 'imageinfo', 'iiprop': 'url|size|mime|extmetadata',
    }
    url = API + '?' + urllib.parse.urlencode(params)
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with op.open(req, timeout=40) as r:
                data = json.loads(r.read().decode('utf-8'))
            break
        except Exception as e:
            if attempt == tries - 1:
                raise
            time.sleep(2 + attempt * 2)
    pages = (data.get('query') or {}).get('pages') or {}
    out = []
    for p in pages.values():
        ii = (p.get('imageinfo') or [{}])[0]
        mime = ii.get('mime', '')
        if mime not in ('image/jpeg', 'image/png'):
            continue
        title = p.get('title', '')
        if title.lower().endswith(('.svg', '.tif', '.gif', '.webp')):
            continue
        out.append({
            'title': title,
            'width': ii.get('width', 0),
            'height': ii.get('height', 0),
            'size': ii.get('size', 0),
            'url': ii.get('url', ''),
        })
    out.sort(key=lambda x: (-(x['width']), -(x['size'])))
    return out[:limit]

DISHES = {
    'gongbaojiding': ['Kung Pao chicken', '宫保鸡丁', 'kung pao'],
    'dongpozhouzi': ['东坡肘子', '肘子', 'Dongpo pork hock', 'braised pork hock', '蹄髈', 'Su-Dongpo ham hock'],
    'maoxuewang': ['maoxuewang', '毛血旺', 'duck blood curd', 'Mao Xuewang'],
    'tangculiyu': ['sweet and sour carp', '糖醋鲤鱼', 'sweet and sour whole fish', 'deep fried carp sweet sour'],
    'congshaohaishen': ['braised sea cucumber', '葱烧海参', 'sea cucumber dish', 'sea cucumber scallion'],
    'jiuzhuandachang': ['braised intestine', '九转大肠', 'stewed pig intestine', 'Jiuqu dachang'],
    'michazhashao': ['Char siu', '叉烧', 'Cantonese barbecued pork', 'char siu pieces'],
    'baiqueji': ['white cut chicken', '白切鸡', 'Hainanese chicken', 'BeiQieJi'],
    'xiajiao': ['Har gow', '虾饺', 'shrimp dumpling dim sum', 'Xiajiao'],
    'duojiyutou': ['剁椒鱼头', 'fish head with chopped chili', 'steamed fish head', 'duo jiao yu tou'],
    'maoshihongshaorou': ['hongshao rou', '红烧肉', 'red braised pork', "Mao braised pork", 'hong shao rou'],
    'kouweixia': ['麻辣小龙虾', '十三香小龙虾', '香辣小龙虾', 'spicy crayfish dish', '小龙虾 菜', 'crayfish plate', 'crawfish boil'],
    'banner': ['Chinese banquet', 'chinese food spread', 'dim sum', 'Peking duck', 'Chinese hot pot', 'chinese dishes table', 'Chinese cuisine table'],
    # ---- 新增 8 道菜 ----
    'mapodoufu': ['麻婆豆腐', 'Mapo tofu', 'mapo doufu'],
    'huiguorou': ['回锅肉', 'Twice cooked pork', 'huiguorou'],
    'baochaoyaohua': ['爆炒腰花', 'stir fried pork kidney', '腰花', 'fried pork kidney'],
    'youmendaxia': ['油焖大虾', 'braised prawns', '油焖大虾', 'red braised prawns'],
    'ganchaoniuhe': ['干炒牛河', 'Beef chow fun', 'dry fried rice noodles beef'],
    'shaoe': ['烧鹅', 'Roast goose', 'Cantonese roast goose'],
    'lajiaochaorou': ['辣椒炒肉', 'pepper fried pork', '辣椒炒肉'],
    'changshachoudoufu': ['长沙臭豆腐', '臭豆腐', 'stinky tofu'],
}

def main():
    op = opener()
    result = {}
    keys = sys.argv[1:] or list(DISHES.keys())
    for key in keys:
        queries = DISHES[key]
        best = []
        seen = set()
        for q in queries:
            try:
                hits = search(op, q, limit=6)
            except Exception as e:
                print('ERR search', key, q, repr(e)[:120], file=sys.stderr)
                time.sleep(1)
                continue
            for h in hits:
                if h['title'] not in seen:
                    seen.add(h['title'])
                    best.append(h)
            if best:
                break
            time.sleep(0.4)
        result[key] = best[:6]
        print('\n##', key)
        for i, h in enumerate(result[key]):
            print('%d) %s | %dx%d | %.0f KB | %s' % (i, h['title'][:70], h['width'], h['height'], h['size']/1024, h['url'][:120]))
        time.sleep(0.3)
    with open('images/_hits.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=1)

if __name__ == '__main__':
    main()
