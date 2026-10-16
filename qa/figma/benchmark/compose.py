from PIL import Image, ImageDraw
B='qa/figma/benchmark/'; D='qa/figma/demos/'
W=300; GAP=24; LBL=28
rows=[[('Headway results',B+'headway-results.png'),('Wattle results',D+'1a-results.png')],
      [('Headway profile',B+'headway-profile-1.png'),('One Medical profile',B+'onemedical-1.png'),('Wattle profile',D+'1b-profile.png')]]
def load(p):
    im=Image.open(p).convert('RGB'); h=round(im.height*W/im.width); return im.resize((W,h),Image.LANCZOS)
tiles=[[(l,load(p)) for l,p in r] for r in rows]
rh=[max(t.height for _,t in r)+LBL for r in tiles]
cols=max(len(r) for r in tiles)
canvas=Image.new('RGB',(GAP+cols*(W+GAP), GAP+sum(h+GAP for h in rh)),'#f3f3f3')
dr=ImageDraw.Draw(canvas); y=GAP
for r,h in zip(tiles,rh):
    x=GAP
    for l,t in r:
        dr.text((x,y+6),l,fill='#1b1b1b'); canvas.paste(t,(x,y+LBL)); dr.rectangle([x,y+LBL,x+W-1,y+LBL+t.height-1],outline='#cfcfcf'); x+=W+GAP
    y+=h+GAP
canvas.save(B+'side-by-side.png'); print(canvas.size)
