"""App Store Connect status / metadata / submission for Block Journey. Runs in GitHub Actions."""
import os,time,json,sys,requests,jwt
KID=os.environ['ASC_KEY_ID'];ISS=os.environ['ASC_ISSUER_ID'];KEY=os.environ['ASC_KEY_PATH'];APP='6838601178'
B='https://api.appstoreconnect.apple.com';MODE=os.environ.get('MODE','status')
def tok():return jwt.encode({'iss':ISS,'iat':int(time.time()),'exp':int(time.time())+1100,'aud':'appstoreconnect-v1'},open(KEY).read(),algorithm='ES256',headers={'kid':KID})
def api(m,p,**kw):
    r=requests.request(m,B+p if p.startswith('/') else p,headers={'Authorization':'Bearer '+tok(),'Content-Type':'application/json'},**kw)
    if r.status_code>=400:print('!!',m,p,r.status_code,r.text[:900])
    return r
def g(p):return api('GET',p).json()
import hashlib,glob
SITE='https://puzzle-journey-ruby.vercel.app'
DESC='''Drop blocks, clear lines and set off huge combos on a tropical island adventure!

Block Journey is a satisfying block puzzle game. Drag pieces onto the board, fill rows and columns to clear them, and chain clears together for big combo scores. Easy to learn, hard to put down.

ISLAND ADVENTURE
Travel across hundreds of hand-built levels in sunny tropical worlds. Every island has a goal, three stars to earn and new surprises: stones, crates, ice and more.

POWER BLOCKS
Earn bombs, rockets and star blocks by playing well, then use Hammer, Reroll, Bomb and Frost boosters when you need a rescue.

3 WAYS TO PLAY
• Adventure: the island map with goals and stars
• Classic: 500 pure block puzzle levels
• Sandbox: endless play for your best score

EVERY DAY THERE'S MORE
• Daily Puzzle, Lucky Spin and login rewards
• Weekly Island Race against other players
• Daily and weekly challenges and leaderboards
• Collect beautiful block skins: Sea Glass, Neon Night, Chrome, Cosmic and more

No account needed. Play offline any time.'''
META=dict(description=DESC,keywords='block,puzzle,blocks,blast,tetris,brain,combo,classic,casual,relaxing,offline,island,adventure',promotionalText="Drop, clear and combo your way across tropical islands. Spin daily for free coins and gems!",supportUrl=SITE+'/support',marketingUrl=SITE)
def metadata():
    v=[x for x in g(f'/v1/apps/{APP}/appStoreVersions?limit=10')['data'] if x['attributes']['appStoreState'] in('PREPARE_FOR_SUBMISSION','DEVELOPER_REJECTED','REJECTED','METADATA_REJECTED')][0];vid=v['id']
    api('PATCH',f'/v1/apps/{APP}',json={'data':{'type':'apps','id':APP,'attributes':{'contentRightsDeclaration':'DOES_NOT_USE_THIRD_PARTY_CONTENT'}}})
    loc=g(f'/v1/appStoreVersions/{vid}/appStoreVersionLocalizations')['data'][0]
    r=api('PATCH',f"/v1/appStoreVersionLocalizations/{loc['id']}",json={'data':{'type':'appStoreVersionLocalizations','id':loc['id'],'attributes':META}});print('version loc',r.status_code)
    info=[i for i in g(f'/v1/apps/{APP}/appInfos')['data'] if i['attributes']['state']!='READY_FOR_DISTRIBUTION'][0];iid=info['id']
    il=g(f'/v1/appInfos/{iid}/appInfoLocalizations')['data'][0]
    r=api('PATCH',f"/v1/appInfoLocalizations/{il['id']}",json={'data':{'type':'appInfoLocalizations','id':il['id'],'attributes':{'subtitle':'Block Puzzle Island Adventure','privacyPolicyUrl':SITE+'/privacy'}}});print('info loc',r.status_code)
    r=api('PATCH',f'/v1/appInfos/{iid}',json={'data':{'type':'appInfos','id':iid,'relationships':{'primaryCategory':{'data':{'type':'appCategories','id':'GAMES'}},'primarySubcategoryOne':{'data':{'type':'appCategories','id':'GAMES_PUZZLE'}},'primarySubcategoryTwo':{'data':{'type':'appCategories','id':'GAMES_CASUAL'}}}}});print('category',r.status_code)
    BOOLS={'datingAndRelationships','messagingAndChat','gambling','parentalControls','healthOrWellnessTopics','unrestrictedWebAccess','sharedLocation','lootBox','socialMedia','ageAssurance','userGeneratedContent','socialMediaAgeRestricted','advertising'}
    ar=g(f'/v1/appInfos/{iid}/ageRatingDeclaration')['data'];new={}
    for k in ar['attributes']:
        if k in('kidsAgeBand','ageRatingOverride','ageRatingOverrideV2','koreaAgeRatingOverride','koreaAgeRatingOverrideV2','developerAgeRatingInfoUrl','seventeenPlus','gracRatingClassificationNumber'):continue
        if 'Override' in k or 'Number' in k or 'Url' in k:continue
        new[k]=False if k=='advertising' else False if k in BOOLS else 'NONE'
    for attempt in range(6):
        r=requests.patch(B+f"/v1/ageRatingDeclarations/{ar['id']}",headers={'Authorization':'Bearer '+tok(),'Content-Type':'application/json'},json={'data':{'type':'ageRatingDeclarations','id':ar['id'],'attributes':new}})
        if r.status_code<300:print('age ok',new);break
        for e in r.json().get('errors',[]):
            d=e.get('detail','');k=e.get('source',{}).get('pointer','').split('/')[-1]
            if 'Expected a BOOLEAN' in d:new[k]=False
            elif 'Expected a STRING' in d or 'Expected' in d and 'STRING' in d:new[k]='NONE'
            elif 'must provide a value' in d:new[k]='NONE'
            elif k in new and ('not' in d.lower() or 'invalid' in d.lower()):new.pop(k,None)
            print('age fix',k,d[:120])
    else:print('AGE FAILED',r.text[:1500])
    # price: free
    ps=g(f'/v1/appPriceSchedules/{APP}/manualPrices').get('data',[])
    if not ps:
        pp=[p for p in g(f'/v1/apps/{APP}/appPricePoints?filter[territory]=USA&limit=10')['data'] if p['attributes']['customerPrice'] in('0.0','0.00','0')][0]['id']
        r=api('POST','/v1/appPriceSchedules',json={'data':{'type':'appPriceSchedules','relationships':{'app':{'data':{'type':'apps','id':APP}},'baseTerritory':{'data':{'type':'territories','id':'USA'}},'manualPrices':{'data':[{'type':'appPrices','id':'${p0}'}]}}},'included':[{'type':'appPrices','id':'${p0}','attributes':{'startDate':None},'relationships':{'appPricePoint':{'data':{'type':'appPricePoints','id':pp}}}}]});print('price',r.status_code)
    # review details (copy contact from 99% Impossible)
    contact={'contactFirstName':'Winsor','contactLastName':'Sineus','contactEmail':'sineusw@gmail.com'}
    for a in g('/v1/apps?filter[bundleId]=com.pettygamesstudios.ninetynineimpossible')['data']:
        for vv in g(f"/v1/apps/{a['id']}/appStoreVersions?limit=5")['data']:
            d=g(f"/v1/appStoreVersions/{vv['id']}/appStoreReviewDetail").get('data')
            if d and d['attributes'].get('contactPhone'):contact.update({k:d['attributes'][k] for k in('contactFirstName','contactLastName','contactEmail','contactPhone') if d['attributes'].get(k)});break
    notes='No login needed. The tutorial can be skipped. Tap Continue on the home screen to play: drag pieces onto the board to clear lines. In-app purchases are in Shop (home screen, Shop button): Starter Chest (one-time), Island Treasure, boosters, Continue Passes, coins and gems; block skins are under Skins; Piggy Bank is the pink Piggy button. Restore Purchases is in the Shop. Free Jungle Coins plays a short video.'
    rd=g(f'/v1/appStoreVersions/{vid}/appStoreReviewDetail').get('data');att=dict(contact,demoAccountRequired=False,notes=notes)
    if rd:r=api('PATCH',f"/v1/appStoreReviewDetails/{rd['id']}",json={'data':{'type':'appStoreReviewDetails','id':rd['id'],'attributes':att}})
    else:r=api('POST','/v1/appStoreReviewDetails',json={'data':{'type':'appStoreReviewDetails','attributes':att,'relationships':{'appStoreVersion':{'data':{'type':'appStoreVersions','id':vid}}}}})
    print('review',r.status_code,'phone' if contact.get('contactPhone') else 'NO PHONE')
    api('PATCH',f'/v1/appStoreVersions/{vid}',json={'data':{'type':'appStoreVersions','id':vid,'attributes':{'copyright':'2026 Petty Games Studio','releaseType':'AFTER_APPROVAL'}}})
    # screenshots
    sets=g(f"/v1/appStoreVersionLocalizations/{loc['id']}/appScreenshotSets")['data'];st=[s for s in sets if s['attributes']['screenshotDisplayType']=='APP_IPHONE_67']
    if st:
        sid=st[0]['id']
        for old in g(f'/v1/appScreenshotSets/{sid}/appScreenshots')['data']:api('DELETE',f"/v1/appScreenshots/{old['id']}")
    else:sid=api('POST','/v1/appScreenshotSets',json={'data':{'type':'appScreenshotSets','attributes':{'screenshotDisplayType':'APP_IPHONE_67'},'relationships':{'appStoreVersionLocalization':{'data':{'type':'appStoreVersionLocalizations','id':loc['id']}}}}}).json()['data']['id']
    for f in sorted(glob.glob('store/shots/app_*.png')):
        b=open(f,'rb').read()
        r=api('POST','/v1/appScreenshots',json={'data':{'type':'appScreenshots','attributes':{'fileName':os.path.basename(f),'fileSize':len(b)},'relationships':{'appScreenshotSet':{'data':{'type':'appScreenshotSets','id':sid}}}}}).json()['data']
        for op in r['attributes']['uploadOperations']:
            requests.request(op['method'],op['url'],headers={h['name']:h['value'] for h in op['requestHeaders']},data=b[op['offset']:op['offset']+op['length']])
        x=api('PATCH',f"/v1/appScreenshots/{r['id']}",json={'data':{'type':'appScreenshots','id':r['id'],'attributes':{'uploaded':True,'sourceFileChecksum':hashlib.md5(b).hexdigest()}}});print('shot',f,x.status_code)
    # attach newest valid build
    bd=g(f'/v1/builds?filter[app]={APP}&filter[processingState]=VALID&sort=-uploadedDate&limit=1')['data'][0]
    if bd['attributes'].get('usesNonExemptEncryption') is None:api('PATCH',f"/v1/builds/{bd['id']}",json={'data':{'type':'builds','id':bd['id'],'attributes':{'usesNonExemptEncryption':False}}})
    print('attach build',bd['attributes']['version'],api('PATCH',f'/v1/appStoreVersions/{vid}/relationships/build',json={'data':{'type':'builds','id':bd['id']}}).status_code)
def ipadshots():
    # 13-inch iPad screenshots only: leaves notes, iPhone shots and build untouched
    v=[x for x in g(f'/v1/apps/{APP}/appStoreVersions?limit=10')['data'] if x['attributes']['appStoreState'] in('PREPARE_FOR_SUBMISSION','DEVELOPER_REJECTED','REJECTED')][0]
    loc=g(f"/v1/appStoreVersions/{v['id']}/appStoreVersionLocalizations")['data'][0]
    T='APP_IPAD_PRO_3GEN_129'
    sets=g(f"/v1/appStoreVersionLocalizations/{loc['id']}/appScreenshotSets")['data'];st=[s for s in sets if s['attributes']['screenshotDisplayType']==T]
    if st:
        sid=st[0]['id']
        for old in g(f'/v1/appScreenshotSets/{sid}/appScreenshots')['data']:api('DELETE',f"/v1/appScreenshots/{old['id']}")
    else:sid=api('POST','/v1/appScreenshotSets',json={'data':{'type':'appScreenshotSets','attributes':{'screenshotDisplayType':T},'relationships':{'appStoreVersionLocalization':{'data':{'type':'appStoreVersionLocalizations','id':loc['id']}}}}}).json()['data']['id']
    for f in sorted(glob.glob('store/shots-ipad/ipad_*.png')):
        b=open(f,'rb').read()
        r=api('POST','/v1/appScreenshots',json={'data':{'type':'appScreenshots','attributes':{'fileName':os.path.basename(f),'fileSize':len(b)},'relationships':{'appScreenshotSet':{'data':{'type':'appScreenshotSets','id':sid}}}}}).json()['data']
        for op in r['attributes']['uploadOperations']:
            requests.request(op['method'],op['url'],headers={h['name']:h['value'] for h in op['requestHeaders']},data=b[op['offset']:op['offset']+op['length']])
        x=api('PATCH',f"/v1/appScreenshots/{r['id']}",json={'data':{'type':'appScreenshots','id':r['id'],'attributes':{'uploaded':True,'sourceFileChecksum':hashlib.md5(b).hexdigest()}}});print('ipad shot',f,x.status_code)
def submitiaps():
    # queue every unsubmitted in-app purchase so it is reviewed together with the app version
    url=f'/v1/apps/{APP}/inAppPurchasesV2?limit=200'
    for i in g(url)['data']:
        st=i['attributes'].get('state');nm=i['attributes'].get('name')
        if st not in('READY_TO_SUBMIT','MISSING_METADATA','DEVELOPER_ACTION_NEEDED','REJECTED'):print('skip',nm,st);continue
        time.sleep(3)
        r=api('POST','/v1/inAppPurchaseSubmissions',json={'data':{'type':'inAppPurchaseSubmissions','relationships':{'inAppPurchaseV2':{'data':{'type':'inAppPurchases','id':i['id']}}}}})
        print('iap',nm,st,r.status_code,'' if r.status_code<300 else r.text[:300])
if MODE=='submitiaps':submitiaps()
if MODE=='ipadshots':ipadshots()
if MODE in('metadata','submit'):metadata()
app=g(f'/v1/apps/{APP}')['data']['attributes'];print('APP',json.dumps(app)[:600])
for v in g(f'/v1/apps/{APP}/appStoreVersions?limit=10')['data']:
    a=v['attributes'];print('VERSION',v['id'],a.get('versionString'),a.get('appStoreState'),a.get('appVersionState'),a.get('releaseType'))
    for l in g(f"/v1/appStoreVersions/{v['id']}/appStoreVersionLocalizations")['data']:
        la=l['attributes'];print('  LOC',l['id'],la['locale'],{k:(len(x) if isinstance(x,str) else x) for k,x in la.items() if k!='locale'})
        for ss in g(f"/v1/appStoreVersionLocalizations/{l['id']}/appScreenshotSets")['data']:print('   SHOTSET',ss['attributes']['screenshotDisplayType'],len(g(f"/v1/appScreenshotSets/{ss['id']}/appScreenshots")['data']))
    b=g(f"/v1/appStoreVersions/{v['id']}/build").get('data');print('  BUILD',b and (b['id'],b['attributes'].get('version')))
    rd=g(f"/v1/appStoreVersions/{v['id']}/appStoreReviewDetail").get('data');print('  REVIEW',rd and rd['attributes'])
for i in g(f'/v1/apps/{APP}/appInfos')['data']:
    print('APPINFO',i['id'],i['attributes'])
    for l in g(f"/v1/appInfos/{i['id']}/appInfoLocalizations")['data']:print('  INFOLOC',l['id'],l['attributes'])
    for rel in ['primaryCategory','ageRatingDeclaration']:
        d=g(f"/v1/appInfos/{i['id']}/{rel}").get('data');print('  ',rel,d and (d['id'],d.get('attributes')))
for bd in g(f'/v1/builds?filter[app]={APP}&sort=-uploadedDate&limit=3')['data']:print('BUILDS',bd['id'],bd['attributes']['version'],bd['attributes']['processingState'],bd['attributes'].get('usesNonExemptEncryption'))
pr=api('GET',f'/v1/apps/{APP}/appPriceSchedule');print('PRICE',pr.status_code,pr.text[:300])
def submit():
    v=[x for x in g(f'/v1/apps/{APP}/appStoreVersions?limit=10')['data'] if x['attributes']['appStoreState'] in('PREPARE_FOR_SUBMISSION','DEVELOPER_REJECTED','REJECTED','METADATA_REJECTED')][0];vid=v['id']
    for d in g(f'/v1/apps/{APP}/inAppPurchasesV2?limit=200')['data']:
        if d['attributes'].get('state')=='READY_TO_SUBMIT':print('iap submit',d['attributes']['productId'],api('POST','/v1/inAppPurchaseSubmissions',json={'data':{'type':'inAppPurchaseSubmissions','relationships':{'inAppPurchaseV2':{'data':{'type':'inAppPurchases','id':d['id']}}}}}).status_code)
    open_=[s for s in g(f'/v1/reviewSubmissions?filter[app]={APP}&filter[state]=READY_FOR_REVIEW')['data']]
    sid=open_[0]['id'] if open_ else api('POST','/v1/reviewSubmissions',json={'data':{'type':'reviewSubmissions','attributes':{'platform':'IOS'},'relationships':{'app':{'data':{'type':'apps','id':APP}}}}}).json()['data']['id']
    print('item',api('POST','/v1/reviewSubmissionItems',json={'data':{'type':'reviewSubmissionItems','relationships':{'reviewSubmission':{'data':{'type':'reviewSubmissions','id':sid}},'appStoreVersion':{'data':{'type':'appStoreVersions','id':vid}}}}}).status_code)
    r=api('PATCH',f'/v1/reviewSubmissions/{sid}',json={'data':{'type':'reviewSubmissions','id':sid,'attributes':{'submitted':True}}});print('SUBMITTED' if r.status_code<300 else 'SUBMIT FAILED',r.status_code)
if MODE=='submit':submit()
