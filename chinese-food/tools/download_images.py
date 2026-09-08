import json, sys, time, urllib.parse, urllib.request, ssl, os

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

UA = 'ChinaFoodCourseSite/1.0 (educational course project; built with urllib)'
API = 'https://commons.wikimedia.org/w/api.php'
PROXY = 'http://127.0.0.1:7890'

PICKS = {
    'gongbaojiding': (['Kung Pao chicken', '宫保鸡丁'], 'Yujiayan'),
    'dongpozhouzi': (['Su-Dongpo ham hock', '东坡肘子', 'Dongpo pork hock', '肘子'], 'Su-Dongpo'),
    'maoxuewang': (['Mao Xuewang', 'maoxuewang', '毛血旺'], 'Chongqing-style'),
    'tangculiyu': (['Tianjin-style deep fried carp', 'sweet and sour carp', '糖醋鲤鱼'], 'Tianjin-style deep fried carp'),
    'congshaohaishen': (['braised sea cucumber', 'sea cucumber scallion', '葱烧海参'], 'Guandong Sea Cucumber'),
    'jiuzhuandachang': (['Jiuqu dachang', '九转大肠', 'braised intestine'], 'Jiuqu dachang'),
    'michazhashao': (['char siu pieces', 'Char siu', '叉烧'], 'Char siu pieces'),
    'baiqueji': (['BeiQieJi', 'white cut chicken', '白切鸡'], 'BeiQieJi'),
    'xiajiao': (['Har gow', '虾饺', 'shrimp dumpling'], '3 pieces of har gow'),
    'duojiyutou': (['剁椒鱼头', 'fish head with chopped chili', 'Hunan cuisine steamed fish head'], 'Hunan cuisine'),
    'maoshihongshaorou': (['hongshao rou', '红烧肉', 'red braised pork'], '红烧肉'),
    'kouweixia': (['麻辣小龙虾', 'spicy crayfish', '微辣小龙虾'], '麻辣小龙虾'),
    'banner': (['Chinese banquet', 'Chinese cuisine table', 'chinese food spread'], 'Chinese banquet in a banquet hall'),
    # ---- 新增 8 道菜 ----
    'mapodoufu': (['Mapo doufu', '麻婆豆腐'], 'Chen Mapo Restaurant'),
    'huiguorou': (['Twice-cooked Pork 回锅肉', '回锅肉', 'Twice cooked pork'], '回锅肉'),
    'baochaoyaohua': (['Wok-Fried Pork Kidney', 'Baochao yaohua', '爆炒腰花'], 'Fengzeyuan'),
    'youmendaxia': (['Shandong-Style Braised Prawns', '油焖大虾', 'braised prawns'], 'Shandong-Style'),
    'ganchaoniuhe': (['Dry-fried Beef Ho Fan', 'Beef chow fun', '干炒牛河'], 'Dry-fried Beef Ho Fan'),
    'shaoe': (['Cantonese roast goose', 'Roast goose', '烧鹅'], 'Cantonese roast goose served'),
    'lajiaochaorou': (['Lajiao Chaorou', '辣椒炒肉', 'pepper fried pork'], 'Xiangzhongyuan Hunan Cuisine'),
    'changshachoudoufu': (['Changsha.zhenzong.choudoufu', 'stinky tofu', '臭豆腐'], 'zhenzong.choudoufu'),
}
WIDTH = {'banner': 1920}

def opener():
    proxy = urllib.request.ProxyHandler({'http': PROXY, 'https': PROXY})
    ctx = ssl.create_default_context()
    return urllib.request.build_opener(proxy, urllib.request.HTTPSHandler(context=ctx))

def get_thumb(op, title, width):
    params = {
        'action': 'query', 'titles': title, 'format': 'json',
        'prop': 'imageinfo', 'iiprop': 'url|size|mime',
        'iiurlwidth': str(width),
    }
    url = API + '?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with op.open(req, timeout=40) as r:
        data = json.loads(r.read().decode('utf-8'))
    pages = (data.get('query') or {}).get('pages') or {}
    for p in pages.values():
        ii = (p.get('imageinfo') or [{}])[0]
        if ii.get('thumburl'):
            return ii['thumburl']
    return None

def find_title(op, queries, match):
    for q in queries:
        params = {
            'action': 'query', 'generator': 'search', 'gsrnamespace': '6',
            'gsrsearch': q, 'gsrlimit': '12', 'format': 'json',
            'prop': 'imageinfo', 'iiprop': 'url|size|mime',
        }
        url = API + '?' + urllib.parse.urlencode(params)
        data = None
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, headers={'User-Agent': UA})
                with op.open(req, timeout=40) as r:
                    data = json.loads(r.read().decode('utf-8'))
                break
            except Exception as e:
                print('search retry', q, repr(e)[:80], file=sys.stderr)
                time.sleep(6 + attempt * 6)
        if data is None:
            continue
        pages = (data.get('query') or {}).get('pages') or {}
        for p in pages.values():
            t = p.get('title', '')
            mime = ((p.get('imageinfo') or [{}])[0]).get('mime', '')
            if match in t and mime in ('image/jpeg', 'image/png'):
                return t
        time.sleep(0.5)
    return None

def download(op, url, dest):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with op.open(req, timeout=60) as r:
        data = r.read()
    with open(dest, 'wb') as f:
        f.write(data)
    return len(data)

def main():
    os.makedirs('images', exist_ok=True)
    op = opener()
    for key, (queries, match) in PICKS.items():
        dest = os.path.join('images', key + '.jpg')
        if os.path.exists(dest) and os.path.getsize(dest) > 10000:
            print('skip ', key, '(exists)')
            continue
        title = find_title(op, queries, match)
        if not title:
            print('NOT FOUND', key, 'match=', match)
            continue
        w = WIDTH.get(key, 1200)
        thumb = get_thumb(op, title, w)
        if not thumb:
            print('NO THUMB', key, title)
            continue
        try:
            n = download(op, thumb, dest)
            print('saved', key, '<-', title[:60], n // 1024, 'KB')
        except Exception as e:
            print('DL FAIL', key, repr(e)[:150], file=sys.stderr)
        time.sleep(0.5)

if __name__ == '__main__':
    main()
