from pathlib import Path
import re,hashlib,threading,http.server,urllib.request
s=Path('index.html').read_text(encoding='utf-8')
ids=re.findall(r'\bid="([^"]+)"',s)
for target in re.findall(r'href="#([^"]+)"',s): assert target in ids,target
server=http.server.ThreadingHTTPServer(('127.0.0.1',8766),http.server.SimpleHTTPRequestHandler)
threading.Thread(target=server.serve_forever,daemon=True).start()
for slug,name,version in re.findall(r'data-stance="([^"]+)".*?<h3>(.*?)</h3><span class="badge">v(.*?)</span>',s):
 f=Path('stances',slug+'.yaml');y=f.read_text()
 assert re.search(r'^name: (.+)$',y,re.M)[1]==name
 assert re.search(r'^version: (.+)$',y,re.M)[1]==version
 assert urllib.request.urlopen('http://127.0.0.1:8766/'+str(f).replace('\\','/')).read()==f.read_bytes()
 print(slug,version,hashlib.sha256(f.read_bytes()).hexdigest().upper())
assert len(re.findall('data-stance=',s))==6
assert len(re.findall(' download=',s))==6
assert not re.search(r'\b(Curious|Devil|Editor|Gossip|Gumroad|GitHub|Twitter)\b',s)
print('PASS: navigation anchors, six versions and names, six HTTP downloads, no obsolete names.')
server.shutdown()
