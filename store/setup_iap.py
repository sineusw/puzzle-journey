"""Create Block Journey in-app purchases in App Store Connect (idempotent). Runs in GitHub Actions."""
import os,time,json,hashlib,sys,requests,jwt
KID=os.environ['ASC_KEY_ID'];ISS=os.environ['ASC_ISSUER_ID'];KEY=os.environ['ASC_KEY_PATH'];APP='6838601178'
B='https://api.appstoreconnect.apple.com'
def tok():return jwt.encode({'iss':ISS,'iat':int(time.time()),'exp':int(time.time())+1100,'aud':'appstoreconnect-v1'},open(KEY).read(),algorithm='ES256',headers={'kid':KID})
def api(m,p,**kw):
    r=requests.request(m,B+p,headers={'Authorization':'Bearer '+tok(),'Content-Type':'application/json'},**kw)
    if r.status_code>=400:print('!!',m,p,r.status_code,r.text[:800])
    return r
PID='com.pettygamesstudios.blockjourney.'
ITEMS=[('starter','Starter Chest','NON_CONSUMABLE','1.99','2,500 coins, 120 gems, boosters and 2 passes.'),
 ('treasure','Island Treasure','CONSUMABLE','9.99','15,000 coins, 600 gems, boosters and 10 passes.'),
 ('hammer3','Hammer x3','CONSUMABLE','0.99','Three Hammers. Smash any one block.'),
 ('refresh3','Reroll x3','CONSUMABLE','0.99','Three Rerolls. Swap your pieces for new ones.'),
 ('bomb3','Bomb x3','CONSUMABLE','1.49','Three Bombs. Blast a 3x3 area clean.'),
 ('freeze3','Frost x3','CONSUMABLE','0.99','Three Frosts. Shield your combo.'),
 ('crate','Booster Crate','CONSUMABLE','3.99','5 of every booster.'),
 ('pass1','Continue Pass','CONSUMABLE','0.99','Keep going after you run out of room.'),
 ('pass5','Continue Passes x5','CONSUMABLE','3.99','Five Continue Passes.'),
 ('coins1','Pile of Jungle Coins','CONSUMABLE','0.99','1,200 Jungle Coins.'),
 ('coins2','Bag of Jungle Coins','CONSUMABLE','4.99','6,500 Jungle Coins.'),
 ('coins3','Chest of Jungle Coins','CONSUMABLE','9.99','15,000 Jungle Coins.'),
 ('gems1','Handful of Gems','CONSUMABLE','1.99','120 gems.'),
 ('gems2','Pouch of Gems','CONSUMABLE','9.99','650 gems.'),
 ('gems3','Vault of Gems','CONSUMABLE','19.99','1,500 gems.'),
 ('piggy','Piggy Bank','CONSUMABLE','1.99','Break open the Piggy Bank and keep its coins.')]
SK=[('ocean','Sea Glass','0.99'),('candy','Candy Pop','0.99'),('jelly','Jelly Wobble','0.99'),('tiki','Tiki Wood','1.99'),('pixel','Retro Pixel','1.99'),('faces','Happy Blocks','1.99'),('frost','Frost Bite','1.99'),('sunset','Lava Glow','1.99'),('midnight','Neon Night','2.99'),('chrome','Chrome','2.99'),('royal','Royal Gems','3.99'),('holo','Holo Foil','3.99'),('cosmic','Cosmic','4.99')]
ITEMS+=[('skin_'+i,n+' Skin','NON_CONSUMABLE',p,'Unlocks the '+n+' block skin.') for i,n,p in SK]
PRODUCTS=[dict(pid=PID+k,name=n,type=ty,price=pr,dn=n,desc=de) for k,n,ty,pr,de in ITEMS]
exist={}
r=api('GET',f'/v1/apps/{APP}/inAppPurchasesV2?limit=200')
for d in r.json().get('data',[]):exist[d['attributes']['productId']]=d
terr=[t['id'] for t in api('GET','/v1/territories?limit=200').json()['data']]
shot='store/iap-review.png';shotb=open(shot,'rb').read()
for P in PRODUCTS:
    print('==',P['pid'])
    if P['pid'] in exist:iid=exist[P['pid']]['id'];print('exists',iid,exist[P['pid']]['attributes'].get('state'))
    else:
        r=api('POST','/v2/inAppPurchases',json={'data':{'type':'inAppPurchases','attributes':{'name':P['name'],'productId':P['pid'],'inAppPurchaseType':P['type'],'reviewNote':'Open Shop (home screen, Shop button). Skins are under Skins; Piggy Bank is the pink Piggy button on the home screen.','familySharable':False},'relationships':{'app':{'data':{'type':'apps','id':APP}}}}})
        iid=r.json()['data']['id'];print('created',iid)
    # localization
    loc=api('GET',f'/v2/inAppPurchases/{iid}/inAppPurchaseLocalizations').json().get('data',[])
    if not any(l['attributes']['locale']=='en-US' for l in loc):
        api('POST','/v1/inAppPurchaseLocalizations',json={'data':{'type':'inAppPurchaseLocalizations','attributes':{'locale':'en-US','name':P['dn'],'description':P['desc']},'relationships':{'inAppPurchaseV2':{'data':{'type':'inAppPurchases','id':iid}}}}})
    # price
    sched=api('GET',f'/v2/inAppPurchases/{iid}/iapPriceSchedule')
    if sched.status_code!=200 or not sched.json().get('data'):
        pp=None;url=f'/v2/inAppPurchases/{iid}/pricePoints?filter[territory]=USA&limit=200'
        while url and not pp:
            j=api('GET',url).json()
            for d in j.get('data',[]):
                if d['attributes']['customerPrice']==P['price']:pp=d['id'];break
            nxt=j.get('links',{}).get('next');url=nxt.replace(B,'') if nxt else None
        print('pricepoint',pp)
        if pp:api('POST','/v1/inAppPurchasePriceSchedules',json={'data':{'type':'inAppPurchasePriceSchedules','relationships':{'inAppPurchase':{'data':{'type':'inAppPurchases','id':iid}},'baseTerritory':{'data':{'type':'territories','id':'USA'}},'manualPrices':{'data':[{'type':'inAppPurchasePrices','id':'${p1}'}]}}},'included':[{'type':'inAppPurchasePrices','id':'${p1}','attributes':{'startDate':None},'relationships':{'inAppPurchasePricePoint':{'data':{'type':'inAppPurchasePricePoints','id':pp}}}}]})
    # availability
    av=api('GET',f'/v2/inAppPurchases/{iid}/inAppPurchaseAvailability')
    if av.status_code!=200 or not av.json().get('data'):
        api('POST','/v1/inAppPurchaseAvailabilities',json={'data':{'type':'inAppPurchaseAvailabilities','attributes':{'availableInNewTerritories':True},'relationships':{'inAppPurchase':{'data':{'type':'inAppPurchases','id':iid}},'availableTerritories':{'data':[{'type':'territories','id':t} for t in terr]}}}})
    # review screenshot
    rs=api('GET',f'/v2/inAppPurchases/{iid}/appStoreReviewScreenshot')
    if rs.status_code!=200 or not rs.json().get('data'):
        r=api('POST','/v1/inAppPurchaseAppStoreReviewScreenshots',json={'data':{'type':'inAppPurchaseAppStoreReviewScreenshots','attributes':{'fileName':'iap-review.png','fileSize':len(shotb)},'relationships':{'inAppPurchaseV2':{'data':{'type':'inAppPurchases','id':iid}}}}})
        if r.status_code<300:
            d=r.json()['data'];sid=d['id']
            for op in d['attributes']['uploadOperations']:
                part=shotb[op['offset']:op['offset']+op['length']]
                requests.request(op['method'],op['url'],headers={h['name']:h['value'] for h in op['requestHeaders']},data=part)
            api('PATCH',f'/v1/inAppPurchaseAppStoreReviewScreenshots/{sid}',json={'data':{'type':'inAppPurchaseAppStoreReviewScreenshots','id':sid,'attributes':{'uploaded':True,'sourceFileChecksum':hashlib.md5(shotb).hexdigest()}}})
    st=api('GET',f'/v2/inAppPurchases/{iid}').json()['data']['attributes'].get('state');print('STATE',P['pid'],st)
# agreement hint
print('Done.')
