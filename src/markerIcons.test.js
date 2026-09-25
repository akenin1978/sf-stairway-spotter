import { expect, it, vi, afterEach } from 'vitest';
afterEach(()=>vi.unstubAllGlobals());
it('reuses raster icons, keeps rating/state distinct and gives verified precedence', async()=>{
 vi.resetModules();
 const ctx={scale:vi.fn(),beginPath:vi.fn(),arc:vi.fn(),fill:vi.fn(),stroke:vi.fn(),fillText:vi.fn(),measureText:vi.fn(()=>({actualBoundingBoxLeft:0,actualBoundingBoxRight:8,actualBoundingBoxAscent:7,actualBoundingBoxDescent:1}))};
 const createElement=vi.fn(()=>({getContext:()=>ctx,toDataURL:()=>`data:image/png;base64,${createElement.mock.calls.length}`}));
 vi.stubGlobal('document',{createElement});
 vi.stubGlobal('window',{google:{maps:{Size:class{constructor(w,h){this.width=w;this.height=h;}},Point:class{constructor(x,y){this.x=x;this.y=y;}}}}});
 const {getStairwayMarkerIcon:get}=await import('./markerIcons');
 const plain=get('#E65100',false,false);
 for(let i=0;i<1266;i++)expect(get('#E65100',false,false)).toBe(plain);
 expect(createElement).toHaveBeenCalledTimes(1);
 const spotted=get('#E65100',true,false);const verified=get('#E65100',true,true);
 expect(get('#E65100',false,true)).toBe(verified);
 expect(spotted).not.toBe(plain);expect(verified).not.toBe(spotted);
 expect(get('#558B2F',false,false)).not.toBe(plain);
 expect(ctx.fillText.mock.calls.map(x=>x[0])).toEqual(['✓','★']);
 expect(plain.scaledSize).toEqual({width:18,height:18});expect(plain.anchor).toEqual({x:9,y:9});
});
