import{d as Ie,aD as et,aE as tt,aQ as at,aH as lt,aI as nt,aJ as st,aK as ot,C as G,c as N,o as p,b as n,u as t,a7 as J,e as l,aa as W,aR as it,_ as Te,j as fe,K as rt,D as Ne,aS as ut,aT as dt,aU as me,aV as Pe,aW as ct,aX as L,aY as A,w as pt,r as w,B as le,H as ne,Z as b,aq as ft,aZ as mt,k as _,g as V,N as se,L as vt,a_ as be,F as K,v as Y,a$ as _e,Q as B,l as M,t as P,aN as gt,aO as O,b0 as Se,E as Ee,a as I,aP as oe,q as ie,a8 as ht,aj as re,a2 as ue,$ as Fe,Y as ke,W as j,X as xe,b1 as Ce,f as Ve,a4 as Me}from"./index-u3ChIZEC.js";import{g as q}from"./imageUrl-Wr3USPEb.js";import{A as D}from"./AdminService-DpEl2DRV.js";import{E as yt}from"./index-DRiRQ3Ks.js";const wt={class:"food-stats-chart"},bt=Ie({__name:"FoodStatsChart",props:{statsData:{}},setup(s){const i=s;et([tt,at,lt,nt,st,ot]);const c=G(()=>{var S;const u=((S=i.statsData)==null?void 0:S.tagsCount)||[],h=u.map(r=>r.name),g=u.map(r=>r.count);return{title:{text:"按标签统计",left:"center"},tooltip:{trigger:"axis",axisPointer:{type:"shadow"}},grid:{left:"3%",right:"4%",bottom:"3%",containLabel:!0},xAxis:{type:"category",data:h,axisLabel:{interval:0,rotate:30}},yAxis:{type:"value",minInterval:1},series:[{name:"数量",type:"bar",data:g,label:{show:!0,position:"top"}}]}});return(u,h)=>(p(),N("div",wt,[n(t(J),{gutter:20},{default:l(()=>[n(t(W),{span:8},{default:l(()=>{var g;return[n(t(it),{title:"总数",value:((g=i.statsData)==null?void 0:g.totalCount)||0},null,8,["value"])]}),_:1}),n(t(W),{span:16},{default:l(()=>[n(t(yt),{class:"chart",option:c.value,autoresize:""},null,8,["option"])]),_:1})]),_:1})]))}}),Ue=Te(bt,[["__scopeId","data-v-c59eaf21"]]);function _t(s){return ut()?(dt(s),!0):!1}const de=new WeakMap,St=(...s)=>{var i;const c=s[0],u=(i=me())==null?void 0:i.proxy;if(u==null&&!Pe())throw new Error("injectLocal must be called in setup");return u&&de.has(u)&&c in de.get(u)?de.get(u)[c]:ct(...s)},Et=typeof window<"u"&&typeof document<"u";typeof WorkerGlobalScope<"u"&&globalThis instanceof WorkerGlobalScope;const Ft=Object.prototype.toString,kt=s=>Ft.call(s)==="[object Object]";function $e(s){return s.endsWith("rem")?Number.parseFloat(s)*16:Number.parseFloat(s)}function ce(s){return Array.isArray(s)?s:[s]}function xt(s){return me()}function Ct(s,i=!0,c){xt()?fe(s,c):i?s():rt(s)}function Vt(s,i,c){return Ne(s,i,{...c,immediate:!0})}const ve=Et?window:void 0;function Mt(s){var i;const c=A(s);return(i=c==null?void 0:c.$el)!=null?i:c}function pe(...s){const i=[],c=()=>{i.forEach(r=>r()),i.length=0},u=(r,f,m,y)=>(r.addEventListener(f,m,y),()=>r.removeEventListener(f,m,y)),h=G(()=>{const r=ce(A(s[0])).filter(f=>f!=null);return r.every(f=>typeof f!="string")?r:void 0}),g=Vt(()=>{var r,f;return[(f=(r=h.value)==null?void 0:r.map(m=>Mt(m)))!=null?f:[ve].filter(m=>m!=null),ce(A(h.value?s[1]:s[0])),ce(t(h.value?s[2]:s[1])),A(h.value?s[3]:s[2])]},([r,f,m,y])=>{if(c(),!(r!=null&&r.length)||!(f!=null&&f.length)||!(m!=null&&m.length))return;const F=kt(y)?{...y}:y;i.push(...r.flatMap(E=>f.flatMap(k=>m.map(C=>u(E,k,C,F)))))},{flush:"post"}),S=()=>{g(),c()};return _t(c),S}function Ut(){const s=L(!1),i=me();return i&&fe(()=>{s.value=!0},i),s}function $t(s){const i=Ut();return G(()=>(i.value,!!s()))}const It=Symbol("vueuse-ssr-width");function Tt(){const s=Pe()?St(It,null):null;return typeof s=="number"?s:void 0}function Nt(s,i={}){const{window:c=ve,ssrWidth:u=Tt()}=i,h=$t(()=>c&&"matchMedia"in c&&typeof c.matchMedia=="function"),g=L(typeof u=="number"),S=L(),r=L(!1),f=m=>{r.value=m.matches};return pt(()=>{if(g.value){g.value=!h.value;const m=A(s).split(",");r.value=m.some(y=>{const F=y.includes("not all"),E=y.match(/\(\s*min-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/),k=y.match(/\(\s*max-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/);let C=!!(E||k);return E&&C&&(C=u>=$e(E[1])),k&&C&&(C=u<=$e(k[1])),F?!C:C});return}h.value&&(S.value=c.matchMedia(A(s)),r.value=S.value.matches)}),pe(S,"change",f,{passive:!0}),G(()=>r.value)}function Pt(s={}){const{window:i=ve,initialWidth:c=Number.POSITIVE_INFINITY,initialHeight:u=Number.POSITIVE_INFINITY,listenOrientation:h=!0,includeScrollbar:g=!0,type:S="inner"}=s,r=L(c),f=L(u),m=()=>{if(i)if(S==="outer")r.value=i.outerWidth,f.value=i.outerHeight;else if(S==="visual"&&i.visualViewport){const{width:F,height:E,scale:k}=i.visualViewport;r.value=Math.round(F*k),f.value=Math.round(E*k)}else g?(r.value=i.innerWidth,f.value=i.innerHeight):(r.value=i.document.documentElement.clientWidth,f.value=i.document.documentElement.clientHeight)};m(),Ct(m);const y={passive:!0};if(pe("resize",m,y),i&&S==="visual"&&i.visualViewport&&pe(i.visualViewport,"resize",m,y),h){const F=Nt("(orientation: portrait)");Ne(F,()=>m())}return{width:r,height:f}}const zt={class:"food-management-view"},Dt={key:0},Wt={class:"tag-popover-content"},Bt={class:"tag-cell-content"},jt={key:0,class:"bottom-stats-container",style:{"margin-top":"20px"}},Rt={class:"card-header"},Ot=["src"],Lt={class:"el-upload__tip"},At={key:0,style:{"margin-top":"30px"}},Ht=Ie({__name:"FoodManagementView",setup(s){const i=w(!1),c=w([]),u=w(!1),h=w(!1),g=w(null),S=w(),r=w(),f=w([]),m=w(""),y=w([]),F=w([]),E=w(1),k=w(10),C=w(0),X=w(!1),z=w(null),R=w(!1),{width:ze}=Pt(),d=le({imageFile:null,imageUrlPreview:null,title:"",description:"",tagNames:[]}),De=le({imageFile:[{required:!0,message:"请选择图片文件",trigger:"change",validator:(a,e,v)=>!u.value&&!d.imageFile?v(new Error("请选择图片文件")):v()}],title:[{required:!1,message:"请输入标题",trigger:"blur"}],tagNames:[{type:"array",message:"请选择或输入标签",trigger:"change"}]}),Z=G(()=>ze.value>=992),We=async()=>{X.value=!0;try{f.value=await D.getAllTags()}catch(a){b.error("获取标签列表失败"),console.error("[FoodManagementView] Error fetching tags:",a)}finally{X.value=!1}},T=async()=>{i.value=!0;try{console.log(`Fetching showcases (page: ${E.value}, limit: ${k.value}, search: ${m.value||"N/A"}, tags: ${y.value.join("|")||"N/A"}`);const a=await D.getFoodShowcases({page:E.value,limit:k.value,search:m.value||void 0,tags:y.value.length>0?y.value:void 0,includeTags:!0});c.value=a.items,C.value=a.totalCount}catch(a){b.error("获取美食列表失败"),console.error("[FoodManagementView] Error fetching showcases:",a),c.value=[],C.value=0}finally{i.value=!1}},ee=()=>{var a,e;(a=S.value)==null||a.resetFields(),d.imageFile=null,d.imageUrlPreview=null,d.title="",d.description="",d.tagNames=[],(e=r.value)==null||e.clearFiles(),u.value=!1,g.value=null},Q=()=>{ee()},Be=a=>{ee(),u.value=!0,g.value=a.id,d.title=a.title||"",d.description=a.description||"",d.tagNames=a.tags?a.tags.map(v=>v.name):[],d.imageUrlPreview=q(a.imageUrl),d.imageFile=null;const e=document.querySelector(".el-col:last-child .el-card .el-card__body");e&&(e.scrollTop=0)},je=a=>{var e,v;if(a.raw)te(a.raw)?(d.imageFile=a.raw,d.imageUrlPreview=URL.createObjectURL(a.raw),(e=S.value)==null||e.validateField("imageFile")):(v=r.value)==null||v.clearFiles();else if(d.imageFile=null,!u.value)d.imageUrlPreview=null;else{const o=c.value.find(U=>U.id===g.value);o&&(d.imageUrlPreview=q(o.imageUrl))}},te=a=>["image/jpeg","image/png","image/gif","image/webp"].includes(a.type)?a.size>5242880?(b.error("图片大小不能超过 5MB!"),!1):!0:(b.error("图片格式错误! 只支持 JPG/PNG/GIF/WEBP."),!1),Re=a=>Promise.resolve(),Oe=async()=>{if(S.value)try{if(await S.value.validate()){h.value=!0;const e=new FormData;e.append("title",d.title),e.append("description",d.description),d.tagNames.forEach(v=>e.append("tags[]",v)),d.imageFile&&e.append("image",d.imageFile);try{u.value&&g.value!==null?(await D.updateFoodShowcase(g.value,e),b.success("更新成功!")):(await D.createFoodShowcase(e),b.success("上传成功!")),ee(),await T(),await H()}catch(v){b.error(`操作失败: ${v.message||"请稍后重试"}`),console.error("[FoodManagementView] Submit error:",v)}finally{h.value=!1}}else console.log("Form validation failed"),b.warning("请检查表单输入")}catch(a){console.log("Validation check failed or was cancelled",a),b.warning("请检查表单输入")}},Le=async a=>{try{await Me.confirm("确定要删除这个美食图片吗？此操作不可撤销。","确认删除",{confirmButtonText:"确定删除",cancelButtonText:"取消",type:"warning"}),await D.deleteFoodShowcase(a),b.success("删除成功!"),await T(),await H(),u.value&&g.value===a&&Q()}catch(e){typeof e=="string"&&e==="cancel"||b.error(`删除失败: ${(e==null?void 0:e.message)||"请稍后重试"}`)}},Ae=a=>{F.value=a},He=async()=>{if(F.value.length!==0)try{await Me.confirm(`确定要删除选中的 ${F.value.length} 项美食图片吗？此操作不可撤销。`,"确认批量删除",{confirmButtonText:"确定删除",cancelButtonText:"取消",type:"warning"});const a=F.value.map(v=>v.id),e=await D.deleteFoodShowcasesBulk(a);b.success(`成功批量删除 ${e.count} 项!`),await T(),await H(),u.value&&g.value&&a.includes(g.value)&&Q()}catch(a){typeof a=="string"&&a==="cancel"||b.error(`批量删除失败: ${(a==null?void 0:a.message)||"请稍后重试"}`)}},qe=a=>{k.value=a,E.value=1,T()},Ge=a=>{E.value=a,T()},H=async()=>{R.value=!0;try{console.log("Fetching showcase stats..."),z.value=await D.getShowcaseStats()}catch(a){console.error("[FoodManagementView] Error fetching stats:",a),z.value=null}finally{R.value=!1}},ge=w(),$=w([]),Qe=le({}),Ke=(a,e)=>{$.value=e.filter(v=>v.raw?he(v.raw):!0)},Ye=(a,e)=>{$.value=e},Je=a=>Promise.resolve(!0),he=a=>te(a),Xe=async()=>{var o,U,ye;if($.value.length===0){b.warning("请至少选择一张图片");return}const a=$.value.filter(x=>x.status==="ready"&&x.raw);if(a.length===0){b.warning("没有有效的新文件可上传");return}h.value=!0,b.info(`开始上传 ${a.length} 张图片...`);let e=0,v=0;for(const x of a){if(!x.raw)continue;const ae=new FormData,Ze=x.name.substring(0,x.name.lastIndexOf("."))||`上传图片 - ${x.name}`;ae.append("title",Ze),ae.append("image",x.raw);try{await D.createFoodShowcase(ae),e++,x.status="success"}catch(we){v++,x.status="fail",console.error(`Error uploading ${x.name}:`,we),b.error(`上传 ${x.name} 失败: ${((U=(o=we.response)==null?void 0:o.data)==null?void 0:U.message)||"未知错误"}`)}}h.value=!1,$.value=$.value.filter(x=>x.status!=="success"),e>0&&(b.success(`成功上传 ${e} 张图片`),E.value=1,T(),H()),v===0&&e>0&&$.value.length===0?($.value=[],(ye=ge.value)==null||ye.clearFiles()):v>0&&b.warning(`${v} 张图片上传失败，请检查后重试`)};return fe(()=>{T(),We(),H()}),(a,e)=>{const v=mt("loading");return p(),N("div",zt,[n(t(J),{gutter:20},{default:l(()=>[n(t(W),{xs:24,sm:24,md:15,lg:15,xl:15},{default:l(()=>[ft((p(),_(t(re),null,{header:l(()=>e[10]||(e[10]=[I("div",{class:"card-header"},[I("span",null,"美食图片列表")],-1)])),default:l(()=>[n(t(J),{gutter:20,class:"filters-row",style:{"margin-bottom":"20px"}},{default:l(()=>[n(t(W),{span:8},{default:l(()=>[n(t(se),{modelValue:m.value,"onUpdate:modelValue":e[0]||(e[0]=o=>m.value=o),placeholder:"搜索标题或描述",clearable:"",onClear:e[1]||(e[1]=o=>T()),onKeyup:e[2]||(e[2]=vt(o=>T(),["enter"]))},null,8,["modelValue"])]),_:1}),n(t(W),{span:8},{default:l(()=>[n(t(be),{modelValue:y.value,"onUpdate:modelValue":e[3]||(e[3]=o=>y.value=o),multiple:"",filterable:"",placeholder:"筛选标签",style:{width:"100%"},clearable:"",onChange:e[4]||(e[4]=o=>T())},{default:l(()=>[(p(!0),N(K,null,Y(f.value,o=>(p(),_(t(_e),{key:o.id||o.name,label:o.name,value:o.name},null,8,["label","value"]))),128))]),_:1},8,["modelValue"])]),_:1}),n(t(W),{span:8,class:"bulk-actions-col"},{default:l(()=>[n(t(B),{type:"danger",disabled:F.value.length===0,onClick:He},{default:l(()=>[M(" 批量删除 ("+P(F.value.length)+") ",1)]),_:1},8,["disabled"])]),_:1})]),_:1}),c.value.length>0?(p(),_(t(gt),{key:0,data:c.value,style:{width:"100%","margin-bottom":"20px"},onSelectionChange:Ae},{default:l(()=>[n(t(O),{type:"selection",width:"55"}),n(t(O),{label:"图片",width:"100"},{default:l(({row:o})=>[n(t(Se),{placement:"right",trigger:"hover",width:"auto"},{reference:l(()=>[n(t(Ee),{src:t(q)(o.imageUrl),style:{width:"60px",height:"60px","object-fit":"cover",display:"block",cursor:"pointer"},fit:"cover",lazy:"","preview-teleported":"","preview-src-list":[t(q)(o.imageUrl)]},null,8,["src","preview-src-list"])]),default:l(()=>[n(t(Ee),{src:t(q)(o.imageUrl),style:{width:"200px",height:"200px","object-fit":"cover"},fit:"cover"},null,8,["src"])]),_:2},1024)]),_:1}),n(t(O),{prop:"title",label:"标题",sortable:""}),n(t(O),{prop:"description",label:"描述","show-overflow-tooltip":!0}),n(t(O),{label:"标签"},{default:l(({row:o})=>[!o.tags||o.tags.length===0?(p(),N("span",Dt,"无")):(p(),_(t(Se),{key:1,placement:"top",trigger:"hover",width:250},{reference:l(()=>[I("div",Bt,[(p(!0),N(K,null,Y(o.tags.slice(0,2),U=>(p(),_(t(oe),{key:U.id,type:"info",size:"small",style:{"margin-right":"5px",cursor:"pointer"}},{default:l(()=>[M(P(U.name),1)]),_:2},1024))),128)),o.tags.length>2?(p(),_(t(oe),{key:0,type:"info",size:"small",style:{cursor:"pointer"}},{default:l(()=>[M(" +"+P(o.tags.length-2),1)]),_:2},1024)):V("",!0)])]),default:l(()=>[I("div",Wt,[(p(!0),N(K,null,Y(o.tags,U=>(p(),_(t(oe),{key:U.id+"-popover",type:"info",size:"small",style:{margin:"2px"}},{default:l(()=>[M(P(U.name),1)]),_:2},1024))),128))])]),_:2},1024))]),_:1}),n(t(O),{label:"操作",width:"150",fixed:"right"},{default:l(({row:o})=>[n(t(B),{size:"small",onClick:U=>Be(o)},{default:l(()=>e[11]||(e[11]=[M("编辑")])),_:2},1032,["onClick"]),n(t(B),{size:"small",type:"danger",onClick:U=>Le(o.id)},{default:l(()=>e[12]||(e[12]=[M("删除")])),_:2},1032,["onClick"])]),_:1})]),_:1},8,["data"])):i.value?V("",!0):(p(),_(t(ie),{key:1,description:"暂无匹配的美食图片数据",style:{"margin-bottom":"20px"}})),C.value>0?(p(),_(t(ht),{key:2,class:"pagination-container",layout:"total, sizes, prev, pager, next, jumper",total:C.value,"current-page":E.value,"onUpdate:currentPage":e[5]||(e[5]=o=>E.value=o),"page-size":k.value,"onUpdate:pageSize":e[6]||(e[6]=o=>k.value=o),"page-sizes":[10,20,50,100],onSizeChange:qe,onCurrentChange:Ge},null,8,["total","current-page","page-size"])):V("",!0)]),_:1})),[[v,i.value]]),n(ne,{name:"fade"},{default:l(()=>[Z.value?V("",!0):(p(),N("div",jt,[n(t(ue)),e[13]||(e[13]=I("h4",null,"统计信息",-1)),z.value?(p(),_(Ue,{key:0,"stats-data":z.value},null,8,["stats-data"])):V("",!0),R.value?(p(),_(t(Fe),{key:1,rows:5,animated:""})):V("",!0),!R.value&&!z.value?(p(),_(t(ie),{key:2,description:"暂无统计数据"})):V("",!0)]))]),_:1})]),_:1}),n(t(W),{xs:24,sm:24,md:9,lg:9,xl:9},{default:l(()=>[n(t(re),null,{header:l(()=>[I("div",Rt,[I("span",null,P(u.value?"编辑美食信息":"新增美食"),1),u.value?(p(),_(t(B),{key:0,link:"",onClick:Q},{default:l(()=>e[14]||(e[14]=[M("取消编辑")])),_:1})):V("",!0)])]),default:l(()=>[n(t(ke),{ref_key:"formRef",ref:S,model:d,rules:De,"label-width":"80px","label-position":"top"},{default:l(()=>[n(t(j),{label:"图片",prop:"imageFile"},{default:l(()=>[n(t(xe),{ref_key:"uploadRef",ref:r,class:"image-uploader",action:"","http-request":Re,"show-file-list":!1,"auto-upload":!1,"on-change":je,"before-upload":te},{tip:l(()=>[I("div",Lt,[M(P(u.value?"点击更换图片 (可选)":"点击上传图片 (必需)")+" ",1),e[15]||(e[15]=I("br",null,null,-1)),e[16]||(e[16]=M(" 只支持 jpg/png/gif/webp, 不超过 5MB "))])]),default:l(()=>[d.imageUrlPreview?(p(),N("img",{key:0,src:d.imageUrlPreview,class:"preview-image"},null,8,Ot)):(p(),_(t(Ve),{key:1,class:"image-uploader-icon"},{default:l(()=>[n(t(Ce))]),_:1}))]),_:1},512)]),_:1}),n(t(j),{label:"标题",prop:"title"},{default:l(()=>[n(t(se),{modelValue:d.title,"onUpdate:modelValue":e[7]||(e[7]=o=>d.title=o),placeholder:"请输入标题"},null,8,["modelValue"])]),_:1}),n(t(j),{label:"描述",prop:"description"},{default:l(()=>[n(t(se),{modelValue:d.description,"onUpdate:modelValue":e[8]||(e[8]=o=>d.description=o),type:"textarea",placeholder:"请输入描述"},null,8,["modelValue"])]),_:1}),n(t(j),{label:"标签",prop:"tagNames"},{default:l(()=>[n(t(be),{modelValue:d.tagNames,"onUpdate:modelValue":e[9]||(e[9]=o=>d.tagNames=o),multiple:"",filterable:"","default-first-option":"",placeholder:"选择已有标签",style:{width:"100%"},loading:X.value,placement:"top-start"},{default:l(()=>[(p(!0),N(K,null,Y(f.value,o=>(p(),_(t(_e),{key:o.name,label:o.name,value:o.name},null,8,["label","value"]))),128))]),_:1},8,["modelValue","loading"])]),_:1}),n(t(j),null,{default:l(()=>[n(t(B),{type:"primary",onClick:Oe,loading:h.value},{default:l(()=>[M(P(u.value?"保存更新":"确认新增"),1)]),_:1},8,["loading"]),n(t(B),{onClick:Q},{default:l(()=>[M(P(u.value?"取消":"重置"),1)]),_:1})]),_:1})]),_:1},8,["model","rules"]),n(t(ue),null,{default:l(()=>e[17]||(e[17]=[M("批量上传")])),_:1}),n(t(ke),{model:Qe,"label-width":"80px","label-position":"top"},{default:l(()=>[n(t(j),{label:"选择图片"},{default:l(()=>[n(t(xe),{ref_key:"multipleUploadRef",ref:ge,action:"","http-request":Je,"on-change":Ke,"on-remove":Ye,"before-upload":he,"file-list":$.value,"list-type":"picture-card",multiple:"","auto-upload":!1},{tip:l(()=>e[18]||(e[18]=[I("div",{class:"el-upload__tip"}," 可选择多张图片 (jpg/png/gif/webp, 单张不超过 5MB) ",-1)])),default:l(()=>[n(t(Ve),null,{default:l(()=>[n(t(Ce))]),_:1})]),_:1},8,["file-list"])]),_:1}),n(t(j),null,{default:l(()=>[n(t(B),{type:"success",onClick:Xe,loading:h.value,disabled:$.value.length===0},{default:l(()=>[M(" 开始上传 ("+P($.value.length)+") ",1)]),_:1},8,["loading","disabled"])]),_:1})]),_:1},8,["model"]),n(ne,{name:"fade"},{default:l(()=>[Z.value?(p(),N("div",At,[n(t(ue)),e[19]||(e[19]=I("h4",null,"统计信息",-1)),z.value?(p(),_(Ue,{key:0,"stats-data":z.value},null,8,["stats-data"])):V("",!0),R.value?(p(),_(t(Fe),{key:1,rows:5,animated:""})):V("",!0),!R.value&&!z.value?(p(),_(t(ie),{key:2,description:"暂无统计数据"})):V("",!0)])):V("",!0)]),_:1})]),_:1})]),_:1})]),_:1}),n(ne,{name:"fade"},{default:l(()=>[Z.value?V("",!0):(p(),_(t(J),{key:0,style:{"margin-top":"20px"}},{default:l(()=>[n(t(W),{span:24},{default:l(()=>[n(t(re))]),_:1})]),_:1}))]),_:1})])}}}),Yt=Te(Ht,[["__scopeId","data-v-bb1c8225"]]);export{Yt as default};
