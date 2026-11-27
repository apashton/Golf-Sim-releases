import{B as go,c as Gt,d as ao,k as pt,l as lu,y as Rs}from"./game.chunk-N7FW727O.js";import{E as ys,b as cu,c as fu,w as _o}from"./game.chunk-2Q5GUPUZ.js";import{A as rr,C as ws,H as au,ca as As,da as su,va as uu,y as ou,z as iu}from"./game.chunk-C7IEXOJZ.js";import{a as io,b as Bc,c as Gc,e as ua}from"./game.chunk-D65CLSHU.js";import{$ as Ac,B as no,W as bc,X as la,Y as Rn,Yc as Pc,Z as Tr,_ as wc,aa as br,ba as wr,ca as ro,ce as jn,da as dt,de as oo,ea as ht,ee as Ar,fe as yn,ga as Rc,ge as Qn,ha as yc,he as Lc,ie as Yo,ja as Cc,je as Dc,ke as ca,le as Uc,me as Ic,ne as Nc,oe as fa,pe as qo,qe as Oc,ve as Fc,we as Hc,xc as Ko}from"./game.chunk-PKX3PBCF.js";import{$ as _a,$a as ri,$b as Pf,A as Zc,Ab as es,Ac as Uf,B as jc,Ba as Kt,Bb as ts,Bc as si,Bd as qt,C as Qc,Ca as bf,Cb as ns,Cc as If,Cg as nu,D as Jc,Da as wf,Db as rs,Dc as Nf,Dd as $f,De as _s,Df as En,Dg as ru,E as ef,Ea as uo,Eb as os,Ec as li,Ee as ho,Ef as eu,F as tf,Fa as ba,Fb as ai,Fc as Of,Fd as hs,Ff as tu,G as nf,Ga as Bn,Gb as is,Gd as ci,Ge as po,H as rf,Ha as Cn,Hc as cs,Hd as ye,He as jf,I as of,Ia as xn,Ie as vs,J as af,Ja as wa,Jd as ps,Je as ui,K as sf,Ka as Aa,L as lf,La as Lr,M as cf,Ma as Af,N as ff,Na as Rf,O as uf,Oa as yf,Od as Ie,P as df,Pa as Cf,Q as hf,Qa as Jt,Qc as fs,R as pf,Ra as er,Rc as us,S as ga,Sa as tr,T as mf,Ta as ei,Td as Kf,U as gf,Ua as Ra,V as _f,Va as nr,Vd as Yf,W as vf,Wa as ya,X as Sf,Xd as Zt,Y as xf,Ya as Ca,Z as Ef,Za as ti,Zc as Ff,Zd as xt,_ as cn,_a as ni,_b as as,_c as Hf,a as kc,aa as va,ab as oi,ac as un,ae as qf,ba as Sa,bb as Pa,bc as Dr,bd as ds,ca as xa,cb as La,cc as ss,cd as qe,d as Vc,da as Ea,db as Da,dc as ls,dd as it,e as da,ea as Ma,eb as Ua,ec as tt,ed as Bf,f as zc,fa as Ta,fb as Ia,ff as di,fg as Es,gb as Na,gd as Gf,ge as Zf,gf as Ss,hb as Oa,hd as kf,he as yt,i as so,ib as Fa,id as Vf,if as Ct,j as Wc,ja as Pr,jb as Ha,jd as zf,k as Rr,ka as Jn,kb as ii,ke as Gn,kg as mo,l as yr,la as Zo,lb as Ba,ld as je,m as kt,ma as jo,mb as Ga,md as Yt,me as Ir,n as Qt,na as co,nb as ka,nd as te,ne as ms,ng as Ms,nh as bs,o as Sn,oa as fn,ob as Va,od as Be,oe as gs,p as lo,pa as Qo,pb as za,pd as ct,q as ha,qa as Mf,qb as Wa,qe as fi,r as pa,ra as Hn,rb as Xa,s as ma,sa as Tf,sb as $a,sf as hi,t as Xc,tb as Ka,td as Wf,tf as Ht,ua as fo,ub as Ya,ud as Lt,uf as xs,v as Cr,vb as qa,vf as Qf,vg as Ts,w as $c,wa as St,wb as Za,wd as en,wf as tn,x as Kc,xa as Jo,xb as ja,xd as Ur,xf as Jf,y as Yc,yb as Qa,yc as Lf,z as qc,za as $t,zb as Ja,zc as Df,zd as Xf}from"./game.chunk-X5TZQDMQ.js";function Iu(){let e=null,n=!1,t=null,r=null;function o(i,a){r=e.requestAnimationFrame(o),t(i,a)}return{start:function(){n!==!0&&t!==null&&e!==null&&(r=e.requestAnimationFrame(o),n=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),n=!1},setAnimationLoop:function(i){t=i},setContext:function(i){e=i}}}function sm(e){let n=new WeakMap;function t(s,l){let c=s.array,f=s.usage,u=c.byteLength,d=e.createBuffer();e.bindBuffer(l,d),e.bufferData(l,c,f),s.onUploadCallback();let h;if(c instanceof Float32Array)h=e.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)h=e.HALF_FLOAT;else if(c instanceof Uint16Array)s.isFloat16BufferAttribute?h=e.HALF_FLOAT:h=e.UNSIGNED_SHORT;else if(c instanceof Int16Array)h=e.SHORT;else if(c instanceof Uint32Array)h=e.UNSIGNED_INT;else if(c instanceof Int32Array)h=e.INT;else if(c instanceof Int8Array)h=e.BYTE;else if(c instanceof Uint8Array)h=e.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)h=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:h,bytesPerElement:c.BYTES_PER_ELEMENT,version:s.version,size:u}}function r(s,l,c){let f=l.array,u=l.updateRanges;if(e.bindBuffer(c,s),u.length===0)e.bufferSubData(c,0,f);else{u.sort((h,_)=>h.start-_.start);let d=0;for(let h=1;h<u.length;h++){let _=u[d],T=u[h];T.start<=_.start+_.count+1?_.count=Math.max(_.count,T.start+T.count-_.start):(++d,u[d]=T)}u.length=d+1;for(let h=0,_=u.length;h<_;h++){let T=u[h];e.bufferSubData(c,T.start*f.BYTES_PER_ELEMENT,f,T.start,T.count)}l.clearUpdateRanges()}l.onUploadCallback()}function o(s){return s.isInterleavedBufferAttribute&&(s=s.data),n.get(s)}function i(s){s.isInterleavedBufferAttribute&&(s=s.data);let l=n.get(s);l&&(e.deleteBuffer(l.buffer),n.delete(s))}function a(s,l){if(s.isInterleavedBufferAttribute&&(s=s.data),s.isGLBufferAttribute){let f=n.get(s);(!f||f.version<s.version)&&n.set(s,{buffer:s.buffer,type:s.type,bytesPerElement:s.elementSize,version:s.version});return}let c=n.get(s);if(c===void 0)n.set(s,t(s,l));else if(c.version<s.version){if(c.size!==s.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");r(c.buffer,s,l),c.version=s.version}}return{get:o,remove:i,update:a}}var lm=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,cm=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,fm=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,um=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,dm=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,hm=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,pm=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,mm=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,gm=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,_m=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,vm=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Sm=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,xm=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Em=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Mm=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Tm=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,bm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,wm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Am=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Rm=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,ym=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Cm=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Pm=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Lm=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Dm=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Um=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Im=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Nm=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Om=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Fm=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Hm="gl_FragColor = linearToOutputTexel( gl_FragColor );",Bm=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Gm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,km=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Vm=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,zm=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Wm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Xm=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,$m=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Km=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Ym=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,qm=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Zm=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,jm=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Qm=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Jm=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,e0=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,t0=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,n0=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,r0=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,o0=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,i0=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,a0=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,s0=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,l0=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,c0=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,f0=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,u0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,d0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,h0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,p0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,m0=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,g0=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,_0=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,v0=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,S0=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,x0=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,E0=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,M0=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,T0=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,b0=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,w0=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,A0=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,R0=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,y0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,C0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,P0=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,L0=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,D0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,U0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,I0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,N0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,O0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,F0=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,H0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,B0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,G0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,k0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,V0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,z0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,W0=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,X0=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,$0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,K0=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Y0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,q0=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Z0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,j0=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Q0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,J0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,eg=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tg=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,ng=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,rg=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,og=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,ig=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,ag=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,sg=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,lg=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,cg=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,fg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ug=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,dg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,hg=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,pg=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,mg=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,gg=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,_g=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,vg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Sg=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,xg=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Eg=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Mg=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Tg=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bg=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,wg=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ag=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Rg=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,yg=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Cg=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Pg=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Lg=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Dg=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Ug=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ig=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Ng=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Og=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Fg=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Hg=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Bg=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Gg=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,kg=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Pe={alphahash_fragment:lm,alphahash_pars_fragment:cm,alphamap_fragment:fm,alphamap_pars_fragment:um,alphatest_fragment:dm,alphatest_pars_fragment:hm,aomap_fragment:pm,aomap_pars_fragment:mm,batching_pars_vertex:gm,batching_vertex:_m,begin_vertex:vm,beginnormal_vertex:Sm,bsdfs:xm,iridescence_fragment:Em,bumpmap_pars_fragment:Mm,clipping_planes_fragment:Tm,clipping_planes_pars_fragment:bm,clipping_planes_pars_vertex:wm,clipping_planes_vertex:Am,color_fragment:Rm,color_pars_fragment:ym,color_pars_vertex:Cm,color_vertex:Pm,common:Lm,cube_uv_reflection_fragment:Dm,defaultnormal_vertex:Um,displacementmap_pars_vertex:Im,displacementmap_vertex:Nm,emissivemap_fragment:Om,emissivemap_pars_fragment:Fm,colorspace_fragment:Hm,colorspace_pars_fragment:Bm,envmap_fragment:Gm,envmap_common_pars_fragment:km,envmap_pars_fragment:Vm,envmap_pars_vertex:zm,envmap_physical_pars_fragment:e0,envmap_vertex:Wm,fog_vertex:Xm,fog_pars_vertex:$m,fog_fragment:Km,fog_pars_fragment:Ym,gradientmap_pars_fragment:qm,lightmap_pars_fragment:Zm,lights_lambert_fragment:jm,lights_lambert_pars_fragment:Qm,lights_pars_begin:Jm,lights_toon_fragment:t0,lights_toon_pars_fragment:n0,lights_phong_fragment:r0,lights_phong_pars_fragment:o0,lights_physical_fragment:i0,lights_physical_pars_fragment:a0,lights_fragment_begin:s0,lights_fragment_maps:l0,lights_fragment_end:c0,lightprobes_pars_fragment:f0,logdepthbuf_fragment:u0,logdepthbuf_pars_fragment:d0,logdepthbuf_pars_vertex:h0,logdepthbuf_vertex:p0,map_fragment:m0,map_pars_fragment:g0,map_particle_fragment:_0,map_particle_pars_fragment:v0,metalnessmap_fragment:S0,metalnessmap_pars_fragment:x0,morphinstance_vertex:E0,morphcolor_vertex:M0,morphnormal_vertex:T0,morphtarget_pars_vertex:b0,morphtarget_vertex:w0,normal_fragment_begin:A0,normal_fragment_maps:R0,normal_pars_fragment:y0,normal_pars_vertex:C0,normal_vertex:P0,normalmap_pars_fragment:L0,clearcoat_normal_fragment_begin:D0,clearcoat_normal_fragment_maps:U0,clearcoat_pars_fragment:I0,iridescence_pars_fragment:N0,opaque_fragment:O0,packing:F0,premultiplied_alpha_fragment:H0,project_vertex:B0,dithering_fragment:G0,dithering_pars_fragment:k0,roughnessmap_fragment:V0,roughnessmap_pars_fragment:z0,shadowmap_pars_fragment:W0,shadowmap_pars_vertex:X0,shadowmap_vertex:$0,shadowmask_pars_fragment:K0,skinbase_vertex:Y0,skinning_pars_vertex:q0,skinning_vertex:Z0,skinnormal_vertex:j0,specularmap_fragment:Q0,specularmap_pars_fragment:J0,tonemapping_fragment:eg,tonemapping_pars_fragment:tg,transmission_fragment:ng,transmission_pars_fragment:rg,uv_pars_fragment:og,uv_pars_vertex:ig,uv_vertex:ag,worldpos_vertex:sg,background_vert:lg,background_frag:cg,backgroundCube_vert:fg,backgroundCube_frag:ug,cube_vert:dg,cube_frag:hg,depth_vert:pg,depth_frag:mg,distance_vert:gg,distance_frag:_g,equirect_vert:vg,equirect_frag:Sg,linedashed_vert:xg,linedashed_frag:Eg,meshbasic_vert:Mg,meshbasic_frag:Tg,meshlambert_vert:bg,meshlambert_frag:wg,meshmatcap_vert:Ag,meshmatcap_frag:Rg,meshnormal_vert:yg,meshnormal_frag:Cg,meshphong_vert:Pg,meshphong_frag:Lg,meshphysical_vert:Dg,meshphysical_frag:Ug,meshtoon_vert:Ig,meshtoon_frag:Ng,points_vert:Og,points_frag:Fg,shadow_vert:Hg,shadow_frag:Bg,sprite_vert:Gg,sprite_frag:kg},ce={common:{diffuse:{value:new ye(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Be},alphaMap:{value:null},alphaMapTransform:{value:new Be},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Be}},envmap:{envMap:{value:null},envMapRotation:{value:new Be},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Be}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Be}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Be},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Be},normalScale:{value:new je(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Be},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Be}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Be}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Be}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ye(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new te},probesMax:{value:new te},probesResolution:{value:new te}},points:{diffuse:{value:new ye(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Be},alphaTest:{value:0},uvTransform:{value:new Be}},sprite:{diffuse:{value:new ye(16777215)},opacity:{value:1},center:{value:new je(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Be},alphaMap:{value:null},alphaMapTransform:{value:new Be},alphaTest:{value:0}}},nn={basic:{uniforms:Ht([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.fog]),vertexShader:Pe.meshbasic_vert,fragmentShader:Pe.meshbasic_frag},lambert:{uniforms:Ht([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new ye(0)},envMapIntensity:{value:1}}]),vertexShader:Pe.meshlambert_vert,fragmentShader:Pe.meshlambert_frag},phong:{uniforms:Ht([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new ye(0)},specular:{value:new ye(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Pe.meshphong_vert,fragmentShader:Pe.meshphong_frag},standard:{uniforms:Ht([ce.common,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.roughnessmap,ce.metalnessmap,ce.fog,ce.lights,{emissive:{value:new ye(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Pe.meshphysical_vert,fragmentShader:Pe.meshphysical_frag},toon:{uniforms:Ht([ce.common,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.gradientmap,ce.fog,ce.lights,{emissive:{value:new ye(0)}}]),vertexShader:Pe.meshtoon_vert,fragmentShader:Pe.meshtoon_frag},matcap:{uniforms:Ht([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,{matcap:{value:null}}]),vertexShader:Pe.meshmatcap_vert,fragmentShader:Pe.meshmatcap_frag},points:{uniforms:Ht([ce.points,ce.fog]),vertexShader:Pe.points_vert,fragmentShader:Pe.points_frag},dashed:{uniforms:Ht([ce.common,ce.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Pe.linedashed_vert,fragmentShader:Pe.linedashed_frag},depth:{uniforms:Ht([ce.common,ce.displacementmap]),vertexShader:Pe.depth_vert,fragmentShader:Pe.depth_frag},normal:{uniforms:Ht([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,{opacity:{value:1}}]),vertexShader:Pe.meshnormal_vert,fragmentShader:Pe.meshnormal_frag},sprite:{uniforms:Ht([ce.sprite,ce.fog]),vertexShader:Pe.sprite_vert,fragmentShader:Pe.sprite_frag},background:{uniforms:{uvTransform:{value:new Be},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Pe.background_vert,fragmentShader:Pe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Be}},vertexShader:Pe.backgroundCube_vert,fragmentShader:Pe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Pe.cube_vert,fragmentShader:Pe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Pe.equirect_vert,fragmentShader:Pe.equirect_frag},distance:{uniforms:Ht([ce.common,ce.displacementmap,{referencePosition:{value:new te},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Pe.distance_vert,fragmentShader:Pe.distance_frag},shadow:{uniforms:Ht([ce.lights,ce.fog,{color:{value:new ye(0)},opacity:{value:1}}]),vertexShader:Pe.shadow_vert,fragmentShader:Pe.shadow_frag}};nn.physical={uniforms:Ht([nn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Be},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Be},clearcoatNormalScale:{value:new je(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Be},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Be},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Be},sheen:{value:0},sheenColor:{value:new ye(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Be},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Be},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Be},transmissionSamplerSize:{value:new je},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Be},attenuationDistance:{value:0},attenuationColor:{value:new ye(0)},specularColor:{value:new ye(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Be},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Be},anisotropyVector:{value:new je},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Be}}]),vertexShader:Pe.meshphysical_vert,fragmentShader:Pe.meshphysical_frag};var pi={r:0,b:0,g:0},Vg=new qt,Nu=new Be;Nu.set(-1,0,0,0,1,0,0,0,1);function zg(e,n,t,r,o,i){let a=new ye(0),s=o===!0?0:1,l,c,f=null,u=0,d=null;function h(v){let x=v.isScene===!0?v.background:null;if(x&&x.isTexture){let g=v.backgroundBlurriness>0;x=n.get(x,g)}return x}function _(v){let x=!1,g=h(v);g===null?p(a,s):g&&g.isColor&&(p(g,1),x=!0);let E=e.xr.getEnvironmentBlendMode();E==="additive"?t.buffers.color.setClear(0,0,0,1,i):E==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,i),(e.autoClear||x)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function T(v,x){let g=h(x);g&&(g.isCubeTexture||g.mapping===co)?(c===void 0&&(c=new yt(new ui(1,1,1),new tn({name:"BackgroundCubeMaterial",uniforms:hi(nn.backgroundCube.uniforms),vertexShader:nn.backgroundCube.vertexShader,fragmentShader:nn.backgroundCube.fragmentShader,side:kt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(E,b,w){this.matrixWorld.copyPosition(w.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(c)),c.material.uniforms.envMap.value=g,c.material.uniforms.backgroundBlurriness.value=x.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Vg.makeRotationFromEuler(x.backgroundRotation)).transpose(),g.isCubeTexture&&g.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Nu),c.material.toneMapped=ct.getTransfer(g.colorSpace)!==tt,(f!==g||u!==g.version||d!==e.toneMapping)&&(c.material.needsUpdate=!0,f=g,u=g.version,d=e.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null)):g&&g.isTexture&&(l===void 0&&(l=new yt(new Ct(2,2),new tn({name:"BackgroundMaterial",uniforms:hi(nn.background.uniforms),vertexShader:nn.background.vertexShader,fragmentShader:nn.background.fragmentShader,side:yr,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(l)),l.material.uniforms.t2D.value=g,l.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,l.material.toneMapped=ct.getTransfer(g.colorSpace)!==tt,g.matrixAutoUpdate===!0&&g.updateMatrix(),l.material.uniforms.uvTransform.value.copy(g.matrix),(f!==g||u!==g.version||d!==e.toneMapping)&&(l.material.needsUpdate=!0,f=g,u=g.version,d=e.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}function p(v,x){v.getRGB(pi,xs(e)),t.buffers.color.setClear(pi.r,pi.g,pi.b,x,i)}function m(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(v,x=1){a.set(v),s=x,p(a,s)},getClearAlpha:function(){return s},setClearAlpha:function(v){s=v,p(a,s)},render:_,addToRenderList:T,dispose:m}}function Wg(e,n){let t=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},o=d(null),i=o,a=!1;function s(P,D,U,L,F){let G=!1,H=u(P,L,U,D);i!==H&&(i=H,c(i.object)),G=h(P,L,U,F),G&&_(P,L,U,F),F!==null&&n.update(F,e.ELEMENT_ARRAY_BUFFER),(G||a)&&(a=!1,g(P,D,U,L),F!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,n.get(F).buffer))}function l(){return e.createVertexArray()}function c(P){return e.bindVertexArray(P)}function f(P){return e.deleteVertexArray(P)}function u(P,D,U,L){let F=L.wireframe===!0,G=r[D.id];G===void 0&&(G={},r[D.id]=G);let H=P.isInstancedMesh===!0?P.id:0,X=G[H];X===void 0&&(X={},G[H]=X);let $=X[U.id];$===void 0&&($={},X[U.id]=$);let j=$[F];return j===void 0&&(j=d(l()),$[F]=j),j}function d(P){let D=[],U=[],L=[];for(let F=0;F<t;F++)D[F]=0,U[F]=0,L[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:D,enabledAttributes:U,attributeDivisors:L,object:P,attributes:{},index:null}}function h(P,D,U,L){let F=i.attributes,G=D.attributes,H=0,X=U.getAttributes();for(let $ in X)if(X[$].location>=0){let Z=F[$],ge=G[$];if(ge===void 0&&($==="instanceMatrix"&&P.instanceMatrix&&(ge=P.instanceMatrix),$==="instanceColor"&&P.instanceColor&&(ge=P.instanceColor)),Z===void 0||Z.attribute!==ge||ge&&Z.data!==ge.data)return!0;H++}return i.attributesNum!==H||i.index!==L}function _(P,D,U,L){let F={},G=D.attributes,H=0,X=U.getAttributes();for(let $ in X)if(X[$].location>=0){let Z=G[$];Z===void 0&&($==="instanceMatrix"&&P.instanceMatrix&&(Z=P.instanceMatrix),$==="instanceColor"&&P.instanceColor&&(Z=P.instanceColor));let ge={};ge.attribute=Z,Z&&Z.data&&(ge.data=Z.data),F[$]=ge,H++}i.attributes=F,i.attributesNum=H,i.index=L}function T(){let P=i.newAttributes;for(let D=0,U=P.length;D<U;D++)P[D]=0}function p(P){m(P,0)}function m(P,D){let U=i.newAttributes,L=i.enabledAttributes,F=i.attributeDivisors;U[P]=1,L[P]===0&&(e.enableVertexAttribArray(P),L[P]=1),F[P]!==D&&(e.vertexAttribDivisor(P,D),F[P]=D)}function v(){let P=i.newAttributes,D=i.enabledAttributes;for(let U=0,L=D.length;U<L;U++)D[U]!==P[U]&&(e.disableVertexAttribArray(U),D[U]=0)}function x(P,D,U,L,F,G,H){H===!0?e.vertexAttribIPointer(P,D,U,F,G):e.vertexAttribPointer(P,D,U,L,F,G)}function g(P,D,U,L){T();let F=L.attributes,G=U.getAttributes(),H=D.defaultAttributeValues;for(let X in G){let $=G[X];if($.location>=0){let j=F[X];if(j===void 0&&(X==="instanceMatrix"&&P.instanceMatrix&&(j=P.instanceMatrix),X==="instanceColor"&&P.instanceColor&&(j=P.instanceColor)),j!==void 0){let Z=j.normalized,ge=j.itemSize,_e=n.get(j);if(_e===void 0)continue;let ke=_e.buffer,Xe=_e.type,Ve=_e.bytesPerElement,Y=Xe===e.INT||Xe===e.UNSIGNED_INT||j.gpuType===ba;if(j.isInterleavedBufferAttribute){let J=j.data,Ee=J.stride,Ue=j.offset;if(J.isInstancedInterleavedBuffer){for(let ve=0;ve<$.locationSize;ve++)m($.location+ve,J.meshPerAttribute);P.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let ve=0;ve<$.locationSize;ve++)p($.location+ve);e.bindBuffer(e.ARRAY_BUFFER,ke);for(let ve=0;ve<$.locationSize;ve++)x($.location+ve,ge/$.locationSize,Xe,Z,Ee*Ve,(Ue+ge/$.locationSize*ve)*Ve,Y)}else{if(j.isInstancedBufferAttribute){for(let J=0;J<$.locationSize;J++)m($.location+J,j.meshPerAttribute);P.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let J=0;J<$.locationSize;J++)p($.location+J);e.bindBuffer(e.ARRAY_BUFFER,ke);for(let J=0;J<$.locationSize;J++)x($.location+J,ge/$.locationSize,Xe,Z,ge*Ve,ge/$.locationSize*J*Ve,Y)}}else if(H!==void 0){let Z=H[X];if(Z!==void 0)switch(Z.length){case 2:e.vertexAttrib2fv($.location,Z);break;case 3:e.vertexAttrib3fv($.location,Z);break;case 4:e.vertexAttrib4fv($.location,Z);break;default:e.vertexAttrib1fv($.location,Z)}}}}v()}function E(){A();for(let P in r){let D=r[P];for(let U in D){let L=D[U];for(let F in L){let G=L[F];for(let H in G)f(G[H].object),delete G[H];delete L[F]}}delete r[P]}}function b(P){if(r[P.id]===void 0)return;let D=r[P.id];for(let U in D){let L=D[U];for(let F in L){let G=L[F];for(let H in G)f(G[H].object),delete G[H];delete L[F]}}delete r[P.id]}function w(P){for(let D in r){let U=r[D];for(let L in U){let F=U[L];if(F[P.id]===void 0)continue;let G=F[P.id];for(let H in G)f(G[H].object),delete G[H];delete F[P.id]}}}function S(P){for(let D in r){let U=r[D],L=P.isInstancedMesh===!0?P.id:0,F=U[L];if(F!==void 0){for(let G in F){let H=F[G];for(let X in H)f(H[X].object),delete H[X];delete F[G]}delete U[L],Object.keys(U).length===0&&delete r[D]}}}function A(){C(),a=!0,i!==o&&(i=o,c(i.object))}function C(){o.geometry=null,o.program=null,o.wireframe=!1}return{setup:s,reset:A,resetDefaultState:C,dispose:E,releaseStatesOfGeometry:b,releaseStatesOfObject:S,releaseStatesOfProgram:w,initAttributes:T,enableAttribute:p,disableUnusedAttributes:v}}function Xg(e,n,t){let r;function o(l){r=l}function i(l,c){e.drawArrays(r,l,c),t.update(c,r,1)}function a(l,c,f){f!==0&&(e.drawArraysInstanced(r,l,c,f),t.update(c,r,f))}function s(l,c,f){if(f===0)return;n.get("WEBGL_multi_draw").multiDrawArraysWEBGL(r,l,0,c,0,f);let d=0;for(let h=0;h<f;h++)d+=c[h];t.update(d,r,1)}this.setMode=o,this.render=i,this.renderInstances=a,this.renderMultiDraw=s}function $g(e,n,t,r){let o;function i(){if(o!==void 0)return o;if(n.has("EXT_texture_filter_anisotropic")===!0){let w=n.get("EXT_texture_filter_anisotropic");o=e.getParameter(w.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else o=0;return o}function a(w){return!(w!==Jt&&r.convert(w)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function s(w){let S=w===xn&&(n.has("EXT_color_buffer_half_float")||n.has("EXT_color_buffer_float"));return!(w!==Kt&&w!==Cn&&!S&&r.convert(w)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function l(w){if(w==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";w="mediump"}return w==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",f=l(c);f!==c&&(qe("WebGLRenderer:",c,"not supported, using",f,"instead."),c=f);let u=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&n.has("EXT_clip_control");t.reversedDepthBuffer===!0&&d===!1&&qe("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let h=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),_=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),T=e.getParameter(e.MAX_TEXTURE_SIZE),p=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),m=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),x=e.getParameter(e.MAX_VARYING_VECTORS),g=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),E=e.getParameter(e.MAX_SAMPLES),b=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:i,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:s,precision:c,logarithmicDepthBuffer:u,reversedDepthBuffer:d,maxTextures:h,maxVertexTextures:_,maxTextureSize:T,maxCubemapSize:p,maxAttributes:m,maxVertexUniforms:v,maxVaryings:x,maxFragmentUniforms:g,maxSamples:E,samples:b}}function Kg(e){let n=this,t=null,r=0,o=!1,i=!1,a=new qf,s=new Be,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let h=u.length!==0||d||r!==0||o;return o=d,r=u.length,h},this.beginShadows=function(){i=!0,f(null)},this.endShadows=function(){i=!1},this.setGlobalState=function(u,d){t=f(u,d,0)},this.setState=function(u,d,h){let _=u.clippingPlanes,T=u.clipIntersection,p=u.clipShadows,m=e.get(u);if(!o||_===null||_.length===0||i&&!p)i?f(null):c();else{let v=i?0:r,x=v*4,g=m.clippingState||null;l.value=g,g=f(_,d,x,h);for(let E=0;E!==x;++E)g[E]=t[E];m.clippingState=g,this.numIntersection=T?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=r>0),n.numPlanes=r,n.numIntersection=0}function f(u,d,h,_){let T=u!==null?u.length:0,p=null;if(T!==0){if(p=l.value,_!==!0||p===null){let m=h+T*4,v=d.matrixWorldInverse;s.getNormalMatrix(v),(p===null||p.length<m)&&(p=new Float32Array(m));for(let x=0,g=h;x!==T;++x,g+=4)a.copy(u[x]).applyMatrix4(v,s),a.normal.toArray(p,g),p[g+3]=a.constant}l.value=p,l.needsUpdate=!0}return n.numPlanes=T,n.numIntersection=0,p}}var Or=4,Yg=6,qg=20,Zg=256,vo=new Ms,du=new ye,Cs=null,Ps=0,Ls=0,Ds=!1,jg=new te,or=new te,gi=class{constructor(n){this._renderer=n,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(n,t=0,r=.1,o=100,i={}){let{size:a=256,position:s=jg}=i;Cs=this._renderer.getRenderTarget(),Ps=this._renderer.getActiveCubeFace(),Ls=this._renderer.getActiveMipmapLevel(),Ds=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(n,r,o,l,s),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(n,t=null){return this._fromTexture(n,t)}fromCubemap(n,t=null){return this._fromTexture(n,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=mu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=pu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(n){this._lodMax=Math.floor(Math.log2(n)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let n=0;n<this._lodMeshes.length;n++)this._lodMeshes[n].geometry.dispose()}_cleanup(n){this._renderer.setRenderTarget(Cs,Ps,Ls),this._renderer.xr.enabled=Ds,n.scissorTest=!1,Nr(n,0,0,n.width,n.height)}_fromTexture(n,t){n.mapping===Pr||n.mapping===Jn?this._setSize(n.image.length===0?16:n.image[0].width||n.image[0].image.width):this._setSize(n.image.width/4),Cs=this._renderer.getRenderTarget(),Ps=this._renderer.getActiveCubeFace(),Ls=this._renderer.getActiveMipmapLevel(),Ds=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let r=t||this._allocateTargets();return this._textureToCubeUV(n,r),this._applyPMREM(r),this._cleanup(r),r}_allocateTargets(){let n=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,r={magFilter:St,minFilter:St,generateMipmaps:!1,type:xn,format:Jt,colorSpace:ss,depthBuffer:!1},o=hu(n,t,r);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==n||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=hu(n,t,r);let{_lodMax:i}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Qg(i)),this._blurMaterial=e_(i,n,t),this._ggxMaterial=Jg(i,n,t)}return o}_compileMaterial(n){let t=new yt(new xt,n);this._renderer.compile(t,vo)}_sceneToCubeUV(n,t,r,o,i){let l=new mo(90,1,t,r),c=[1,-1,1,1,1,1],f=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,h=u.toneMapping;u.getClearColor(du),u.toneMapping=cn,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(o),u.clearDepth(),u.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new yt(new ui,new Zf({name:"PMREM.Background",side:kt,depthWrite:!1,depthTest:!1})));let T=this._backgroundBox,p=T.material,m=!1,v=n.background;v?v.isColor&&(p.color.copy(v),n.background=null,m=!0):(p.color.copy(du),m=!0);for(let x=0;x<6;x++){let g=x%3;g===0?(l.up.set(0,c[x],0),l.position.set(i.x,i.y,i.z),l.lookAt(i.x+f[x],i.y,i.z)):g===1?(l.up.set(0,0,c[x]),l.position.set(i.x,i.y,i.z),l.lookAt(i.x,i.y+f[x],i.z)):(l.up.set(0,c[x],0),l.position.set(i.x,i.y,i.z),l.lookAt(i.x,i.y,i.z+f[x]));let E=this._cubeSize;Nr(o,g*E,x>2?E:0,E,E),u.setRenderTarget(o),m&&u.render(T,l),u.render(n,l)}u.toneMapping=h,u.autoClear=d,n.background=v}_textureToCubeUV(n,t){let r=this._renderer,o=n.mapping===Pr||n.mapping===Jn;o?(this._cubemapMaterial===null&&(this._cubemapMaterial=mu()),this._cubemapMaterial.uniforms.flipEnvMap.value=n.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=pu());let i=o?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=i;let s=i.uniforms;s.envMap.value=n;let l=this._cubeSize;Nr(t,0,0,3*l,2*l),r.setRenderTarget(t),r.render(a,vo)}_applyPMREM(n){let t=this._renderer,r=t.autoClear;t.autoClear=!1;let o=this._lodMeshes.length;for(let i=1;i<o;i++)this._applyGGXFilter(n,i-1,i);t.autoClear=r}_applyGGXFilter(n,t,r){let o=this._renderer,i=this._pingPongRenderTarget,a=this._ggxMaterial,s=this._lodMeshes[r];s.material=a;let l=a.uniforms,c=r/(this._lodMeshes.length-1),f=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-f*f),d=c*1.25,h=u*d,{_lodMax:_}=this,T=this._sizeLods[r],p=3*T*(r>_-Or?r-_+Or:0),m=4*(this._cubeSize-T);l.envMap.value=n.texture,l.roughness.value=h,l.mipInt.value=_-t,Nr(i,p,m,3*T,2*T),o.setRenderTarget(i),o.render(s,vo),l.envMap.value=i.texture,l.roughness.value=0,l.mipInt.value=_-r,Nr(n,p,m,3*T,2*T),o.setRenderTarget(n),o.render(s,vo)}_blur(n,t,r,o){let i=this._pingPongRenderTarget,a=Math.min(o,Math.PI)/Math.SQRT2;this._blurPass(n,i,t,r,a),this._blurPass(i,n,r,r,a)}_blurPass(n,t,r,o,i){let a=this._renderer,s=this._blurMaterial,l=this._lodMeshes[o];l.material=s;let c=s.uniforms;c.envMap.value=n.texture,c.sigma.value=i,c.mipInt.value=this._lodMax-r;let f=this._sizeLods[o],u=3*f*(o>this._lodMax-Or?o-this._lodMax+Or:0),d=4*(this._cubeSize-f);Nr(t,u,d,3*f,2*f),a.setRenderTarget(t),a.render(l,vo)}};function Qg(e){let n=[],t=[],r=e,o=e-Or+1+Yg;for(let i=0;i<o;i++){let a=Math.pow(2,r);n.push(a);let s=1/(a-2),l=-s,c=1+s,f=[l,l,c,l,c,c,l,l,c,c,l,c],u=6,d=6,h=3,_=new Float32Array(h*d*u),T=new Float32Array(h*d*u);for(let m=0;m<u;m++){let v=m%3*2/3-1,x=m>2?0:-1,g=[v,x,0,v+2/3,x,0,v+2/3,x+1,0,v,x,0,v+2/3,x+1,0,v,x+1,0];_.set(g,h*d*m);for(let E=0;E<d;E++){let b=f[E*2]*2-1,w=f[E*2+1]*2-1;m===0?or.set(1,w,b):m===1?or.set(-b,1,-w):m===2?or.set(-b,w,1):m===3?or.set(-1,w,-b):m===4?or.set(-b,-1,w):or.set(b,w,-1),or.toArray(T,(m*d+E)*h)}}let p=new xt;p.setAttribute("position",new Ie(_,h)),p.setAttribute("outputDirection",new Ie(T,h)),t.push(new yt(p,null)),r>Or&&r--}return{lodMeshes:t,sizeLods:n}}function hu(e,n,t){let r=new en(e,n,t);return r.texture.mapping=co,r.texture.name="PMREM.cubeUv",r.scissorTest=!0,r}function Nr(e,n,t,r,o){e.viewport.set(n,t,r,o),e.scissor.set(n,t,r,o)}function Jg(e,n,t){return new tn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Zg,CUBEUV_TEXEL_WIDTH:1/n,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:vi(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function e_(e,n,t){return new tn({name:"SphericalGaussianBlur",defines:{SAMPLES:qg,CUBEUV_TEXEL_WIDTH:1/n,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:vi(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function pu(){return new tn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:vi(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function mu(){return new tn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:vi(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function vi(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var _i=class extends en{constructor(n=1,t={}){super(n,n,t),this.isWebGLCubeRenderTarget=!0;let r={width:n,height:n,depth:1},o=[r,r,r,r,r,r];this.texture=new _s(o),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(n,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let r={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},o=new ui(5,5,5),i=new tn({name:"CubemapFromEquirect",uniforms:hi(r.uniforms),vertexShader:r.vertexShader,fragmentShader:r.fragmentShader,side:kt,blending:Sn});i.uniforms.tEquirect.value=t;let a=new yt(o,i),s=t.minFilter;return t.minFilter===$t&&(t.minFilter=St),new nu(1,10,this).update(n,a),t.minFilter=s,a.geometry.dispose(),a.material.dispose(),this}clear(n,t=!0,r=!0,o=!0){let i=n.getRenderTarget();for(let a=0;a<6;a++)n.setRenderTarget(this,a),n.clear(t,r,o);n.setRenderTarget(i)}};function t_(e){let n=new WeakMap,t=new WeakMap,r=null;function o(d,h=!1){return d==null?null:h?a(d):i(d)}function i(d){if(d&&d.isTexture){let h=d.mapping;if(h===Zo||h===jo)if(n.has(d)){let _=n.get(d).texture;return s(_,d.mapping)}else{let _=d.image;if(_&&_.height>0){let T=new _i(_.height);return T.fromEquirectangularTexture(e,d),n.set(d,T),d.addEventListener("dispose",c),s(T.texture,d.mapping)}else return null}}return d}function a(d){if(d&&d.isTexture){let h=d.mapping,_=h===Zo||h===jo,T=h===Pr||h===Jn;if(_||T){let p=t.get(d),m=p!==void 0?p.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==m)return r===null&&(r=new gi(e)),p=_?r.fromEquirectangular(d,p):r.fromCubemap(d,p),p.texture.pmremVersion=d.pmremVersion,t.set(d,p),p.texture;if(p!==void 0)return p.texture;{let v=d.image;return _&&v&&v.height>0||T&&v&&l(v)?(r===null&&(r=new gi(e)),p=_?r.fromEquirectangular(d):r.fromCubemap(d),p.texture.pmremVersion=d.pmremVersion,t.set(d,p),d.addEventListener("dispose",f),p.texture):null}}}return d}function s(d,h){return h===Zo?d.mapping=Pr:h===jo&&(d.mapping=Jn),d}function l(d){let h=0,_=6;for(let T=0;T<_;T++)d[T]!==void 0&&h++;return h===_}function c(d){let h=d.target;h.removeEventListener("dispose",c);let _=n.get(h);_!==void 0&&(n.delete(h),_.dispose())}function f(d){let h=d.target;h.removeEventListener("dispose",f);let _=t.get(h);_!==void 0&&(t.delete(h),_.dispose())}function u(){n=new WeakMap,t=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:o,dispose:u}}function n_(e){let n={};function t(r){if(n[r]!==void 0)return n[r];let o=e.getExtension(r);return n[r]=o,o}return{has:function(r){return t(r)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(r){let o=t(r);return o===null&&Bf("WebGLRenderer: "+r+" extension not supported."),o}}}function r_(e,n,t,r){let o={},i=new WeakMap;function a(u){let d=u.target;d.index!==null&&n.remove(d.index);for(let _ in d.attributes)n.remove(d.attributes[_]);d.removeEventListener("dispose",a),delete o[d.id];let h=i.get(d);h&&(n.remove(h),i.delete(d)),r.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function s(u,d){return o[d.id]===!0||(d.addEventListener("dispose",a),o[d.id]=!0,t.memory.geometries++),d}function l(u){let d=u.attributes;for(let h in d)n.update(d[h],e.ARRAY_BUFFER)}function c(u){let d=[],h=u.index,_=u.attributes.position,T=0;if(_===void 0)return;if(h!==null){let v=h.array;T=h.version;for(let x=0,g=v.length;x<g;x+=3){let E=v[x+0],b=v[x+1],w=v[x+2];d.push(E,b,b,w,w,E)}}else{let v=_.array;T=_.version;for(let x=0,g=v.length/3-1;x<g;x+=3){let E=x+0,b=x+1,w=x+2;d.push(E,b,b,w,w,E)}}let p=new(_.count>=65535?Yf:Kf)(d,1);p.version=T;let m=i.get(u);m&&n.remove(m),i.set(u,p)}function f(u){let d=i.get(u);if(d){let h=u.index;h!==null&&d.version<h.version&&c(u)}else c(u);return i.get(u)}return{get:s,update:l,getWireframeAttribute:f}}function o_(e,n,t){let r;function o(u){r=u}let i,a;function s(u){i=u.type,a=u.bytesPerElement}function l(u,d){e.drawElements(r,d,i,u*a),t.update(d,r,1)}function c(u,d,h){h!==0&&(e.drawElementsInstanced(r,d,i,u*a,h),t.update(d,r,h))}function f(u,d,h){if(h===0)return;n.get("WEBGL_multi_draw").multiDrawElementsWEBGL(r,d,0,i,u,0,h);let T=0;for(let p=0;p<h;p++)T+=d[p];t.update(T,r,1)}this.setMode=o,this.setIndex=s,this.render=l,this.renderInstances=c,this.renderMultiDraw=f}function i_(e){let n={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function r(i,a,s){switch(t.calls++,a){case e.TRIANGLES:t.triangles+=s*(i/3);break;case e.LINES:t.lines+=s*(i/2);break;case e.LINE_STRIP:t.lines+=s*(i-1);break;case e.LINE_LOOP:t.lines+=s*i;break;case e.POINTS:t.points+=s*i;break;default:it("WebGLInfo: Unknown draw mode:",a);break}}function o(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:n,render:t,programs:null,autoReset:!0,reset:o,update:r}}function a_(e,n,t){let r=new WeakMap,o=new Lt;function i(a,s,l){let c=a.morphTargetInfluences,f=s.morphAttributes.position||s.morphAttributes.normal||s.morphAttributes.color,u=f!==void 0?f.length:0,d=r.get(s);if(d===void 0||d.count!==u){let A=function(){w.dispose(),r.delete(s),s.removeEventListener("dispose",A)};d!==void 0&&d.texture.dispose();let h=s.morphAttributes.position!==void 0,_=s.morphAttributes.normal!==void 0,T=s.morphAttributes.color!==void 0,p=s.morphAttributes.position||[],m=s.morphAttributes.normal||[],v=s.morphAttributes.color||[],x=0;h===!0&&(x=1),_===!0&&(x=2),T===!0&&(x=3);let g=s.attributes.position.count*x,E=1;g>n.maxTextureSize&&(E=Math.ceil(g/n.maxTextureSize),g=n.maxTextureSize);let b=new Float32Array(g*E*4*u),w=new Ur(b,g,E,u);w.type=Cn,w.needsUpdate=!0;let S=x*4;for(let C=0;C<u;C++){let P=p[C],D=m[C],U=v[C],L=g*E*4*C;for(let F=0;F<P.count;F++){let G=F*S;h===!0&&(o.fromBufferAttribute(P,F),b[L+G+0]=o.x,b[L+G+1]=o.y,b[L+G+2]=o.z,b[L+G+3]=0),_===!0&&(o.fromBufferAttribute(D,F),b[L+G+4]=o.x,b[L+G+5]=o.y,b[L+G+6]=o.z,b[L+G+7]=0),T===!0&&(o.fromBufferAttribute(U,F),b[L+G+8]=o.x,b[L+G+9]=o.y,b[L+G+10]=o.z,b[L+G+11]=U.itemSize===4?o.w:1)}}d={count:u,texture:w,size:new je(g,E)},r.set(s,d),s.addEventListener("dispose",A)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(e,"morphTexture",a.morphTexture,t);else{let h=0;for(let T=0;T<c.length;T++)h+=c[T];let _=s.morphTargetsRelative?1:1-h;l.getUniforms().setValue(e,"morphTargetBaseInfluence",_),l.getUniforms().setValue(e,"morphTargetInfluences",c)}l.getUniforms().setValue(e,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(e,"morphTargetsTextureSize",d.size)}return{update:i}}function s_(e,n,t,r,o){let i=new WeakMap;function a(c){let f=o.render.frame,u=c.geometry,d=n.get(c,u);if(i.get(d)!==f&&(n.update(d),i.set(d,f)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),i.get(c)!==f&&(t.update(c.instanceMatrix,e.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,e.ARRAY_BUFFER),i.set(c,f))),c.isSkinnedMesh){let h=c.skeleton;i.get(h)!==f&&(h.update(),i.set(h,f))}return d}function s(){i=new WeakMap}function l(c){let f=c.target;f.removeEventListener("dispose",l),r.releaseStatesOfObject(f),t.remove(f.instanceMatrix),f.instanceColor!==null&&t.remove(f.instanceColor)}return{update:a,dispose:s}}var l_={[_a]:"LINEAR_TONE_MAPPING",[va]:"REINHARD_TONE_MAPPING",[Sa]:"CINEON_TONE_MAPPING",[xa]:"ACES_FILMIC_TONE_MAPPING",[Ma]:"AGX_TONE_MAPPING",[Ta]:"NEUTRAL_TONE_MAPPING",[Ea]:"CUSTOM_TONE_MAPPING"};function c_(e,n,t,r,o,i){let a=new en(n,t,{type:e,depthBuffer:o,stencilBuffer:i,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,l=null,c=new xt;c.setAttribute("position",new Zt([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new Zt([0,2,0,0,2,0],2));let f=new Jf({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),u=new yt(c,f),d=new Ms(-1,1,1,-1,0,1),h=null,_=null,T=!1,p,m=null,v=[],x=!1;this.setSize=function(g,E){a.setSize(g,E),s!==null&&s.setSize(g,E),l!==null&&l.setSize(g,E);for(let b=0;b<v.length;b++){let w=v[b];w.setSize&&w.setSize(g,E)}},this.setEffects=function(g){v=g,x=v.length>0&&v[0].isRenderPass===!0;let E=a.width,b=a.height;v.length>0&&s===null&&(s=new en(E,b,{type:xn,depthBuffer:!1,stencilBuffer:!1}),l=new en(E,b,{type:xn,depthBuffer:!1,stencilBuffer:!1}));for(let w=0;w<v.length;w++){let S=v[w];S.setSize&&S.setSize(E,b)}},this.begin=function(g,E){if(T||g.toneMapping===cn&&v.length===0)return!1;if(m=E,E!==null){let b=E.width,w=E.height;(a.width!==b||a.height!==w)&&this.setSize(b,w)}return x===!1&&g.setRenderTarget(a),p=g.toneMapping,g.toneMapping=cn,!0},this.hasRenderPass=function(){return x},this.end=function(g,E){g.toneMapping=p,T=!0;let b=a,w=s;for(let S=0;S<v.length;S++){let A=v[S];A.enabled!==!1&&(A.render(g,w,b,E),A.needsSwap!==!1&&(b=w,w=w===s?l:s))}if(h!==g.outputColorSpace||_!==g.toneMapping){h=g.outputColorSpace,_=g.toneMapping,f.defines={},ct.getTransfer(h)===tt&&(f.defines.SRGB_TRANSFER="");let S=l_[_];S&&(f.defines[S]=""),f.needsUpdate=!0}f.uniforms.tDiffuse.value=b.texture,g.setRenderTarget(m),g.render(u,d),m=null,T=!1},this.isCompositing=function(){return T},this.dispose=function(){a.dispose(),s!==null&&s.dispose(),l!==null&&l.dispose(),c.dispose(),f.dispose()}}var Ou=new Wf,Ns=new po(1,1),Fu=new Ur,Hu=new Xf,Bu=new _s,gu=[],_u=[],vu=new Float32Array(16),Su=new Float32Array(9),xu=new Float32Array(4);function Hr(e,n,t){let r=e[0];if(r<=0||r>0)return e;let o=n*t,i=gu[o];if(i===void 0&&(i=new Float32Array(o),gu[o]=i),n!==0){r.toArray(i,0);for(let a=1,s=0;a!==n;++a)s+=t,e[a].toArray(i,s)}return i}function Tt(e,n){if(e.length!==n.length)return!1;for(let t=0,r=e.length;t<r;t++)if(e[t]!==n[t])return!1;return!0}function bt(e,n){for(let t=0,r=n.length;t<r;t++)e[t]=n[t]}function Si(e,n){let t=_u[n];t===void 0&&(t=new Int32Array(n),_u[n]=t);for(let r=0;r!==n;++r)t[r]=e.allocateTextureUnit();return t}function f_(e,n){let t=this.cache;t[0]!==n&&(e.uniform1f(this.addr,n),t[0]=n)}function u_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2f(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(Tt(t,n))return;e.uniform2fv(this.addr,n),bt(t,n)}}function d_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3f(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else if(n.r!==void 0)(t[0]!==n.r||t[1]!==n.g||t[2]!==n.b)&&(e.uniform3f(this.addr,n.r,n.g,n.b),t[0]=n.r,t[1]=n.g,t[2]=n.b);else{if(Tt(t,n))return;e.uniform3fv(this.addr,n),bt(t,n)}}function h_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4f(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(Tt(t,n))return;e.uniform4fv(this.addr,n),bt(t,n)}}function p_(e,n){let t=this.cache,r=n.elements;if(r===void 0){if(Tt(t,n))return;e.uniformMatrix2fv(this.addr,!1,n),bt(t,n)}else{if(Tt(t,r))return;xu.set(r),e.uniformMatrix2fv(this.addr,!1,xu),bt(t,r)}}function m_(e,n){let t=this.cache,r=n.elements;if(r===void 0){if(Tt(t,n))return;e.uniformMatrix3fv(this.addr,!1,n),bt(t,n)}else{if(Tt(t,r))return;Su.set(r),e.uniformMatrix3fv(this.addr,!1,Su),bt(t,r)}}function g_(e,n){let t=this.cache,r=n.elements;if(r===void 0){if(Tt(t,n))return;e.uniformMatrix4fv(this.addr,!1,n),bt(t,n)}else{if(Tt(t,r))return;vu.set(r),e.uniformMatrix4fv(this.addr,!1,vu),bt(t,r)}}function __(e,n){let t=this.cache;t[0]!==n&&(e.uniform1i(this.addr,n),t[0]=n)}function v_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2i(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(Tt(t,n))return;e.uniform2iv(this.addr,n),bt(t,n)}}function S_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3i(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else{if(Tt(t,n))return;e.uniform3iv(this.addr,n),bt(t,n)}}function x_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4i(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(Tt(t,n))return;e.uniform4iv(this.addr,n),bt(t,n)}}function E_(e,n){let t=this.cache;t[0]!==n&&(e.uniform1ui(this.addr,n),t[0]=n)}function M_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2ui(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(Tt(t,n))return;e.uniform2uiv(this.addr,n),bt(t,n)}}function T_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3ui(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else{if(Tt(t,n))return;e.uniform3uiv(this.addr,n),bt(t,n)}}function b_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4ui(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(Tt(t,n))return;e.uniform4uiv(this.addr,n),bt(t,n)}}function w_(e,n,t){let r=this.cache,o=t.allocateTextureUnit();r[0]!==o&&(e.uniform1i(this.addr,o),r[0]=o);let i;this.type===e.SAMPLER_2D_SHADOW?(Ns.compareFunction=t.isReversedDepthBuffer()?li:si,i=Ns):i=Ou,t.setTexture2D(n||i,o)}function A_(e,n,t){let r=this.cache,o=t.allocateTextureUnit();r[0]!==o&&(e.uniform1i(this.addr,o),r[0]=o),t.setTexture3D(n||Hu,o)}function R_(e,n,t){let r=this.cache,o=t.allocateTextureUnit();r[0]!==o&&(e.uniform1i(this.addr,o),r[0]=o),t.setTextureCube(n||Bu,o)}function y_(e,n,t){let r=this.cache,o=t.allocateTextureUnit();r[0]!==o&&(e.uniform1i(this.addr,o),r[0]=o),t.setTexture2DArray(n||Fu,o)}function C_(e){switch(e){case 5126:return f_;case 35664:return u_;case 35665:return d_;case 35666:return h_;case 35674:return p_;case 35675:return m_;case 35676:return g_;case 5124:case 35670:return __;case 35667:case 35671:return v_;case 35668:case 35672:return S_;case 35669:case 35673:return x_;case 5125:return E_;case 36294:return M_;case 36295:return T_;case 36296:return b_;case 35678:case 36198:case 36298:case 36306:case 35682:return w_;case 35679:case 36299:case 36307:return A_;case 35680:case 36300:case 36308:case 36293:return R_;case 36289:case 36303:case 36311:case 36292:return y_}}function P_(e,n){e.uniform1fv(this.addr,n)}function L_(e,n){let t=Hr(n,this.size,2);e.uniform2fv(this.addr,t)}function D_(e,n){let t=Hr(n,this.size,3);e.uniform3fv(this.addr,t)}function U_(e,n){let t=Hr(n,this.size,4);e.uniform4fv(this.addr,t)}function I_(e,n){let t=Hr(n,this.size,4);e.uniformMatrix2fv(this.addr,!1,t)}function N_(e,n){let t=Hr(n,this.size,9);e.uniformMatrix3fv(this.addr,!1,t)}function O_(e,n){let t=Hr(n,this.size,16);e.uniformMatrix4fv(this.addr,!1,t)}function F_(e,n){e.uniform1iv(this.addr,n)}function H_(e,n){e.uniform2iv(this.addr,n)}function B_(e,n){e.uniform3iv(this.addr,n)}function G_(e,n){e.uniform4iv(this.addr,n)}function k_(e,n){e.uniform1uiv(this.addr,n)}function V_(e,n){e.uniform2uiv(this.addr,n)}function z_(e,n){e.uniform3uiv(this.addr,n)}function W_(e,n){e.uniform4uiv(this.addr,n)}function X_(e,n,t){let r=this.cache,o=n.length,i=Si(t,o);Tt(r,i)||(e.uniform1iv(this.addr,i),bt(r,i));let a;this.type===e.SAMPLER_2D_SHADOW?a=Ns:a=Ou;for(let s=0;s!==o;++s)t.setTexture2D(n[s]||a,i[s])}function $_(e,n,t){let r=this.cache,o=n.length,i=Si(t,o);Tt(r,i)||(e.uniform1iv(this.addr,i),bt(r,i));for(let a=0;a!==o;++a)t.setTexture3D(n[a]||Hu,i[a])}function K_(e,n,t){let r=this.cache,o=n.length,i=Si(t,o);Tt(r,i)||(e.uniform1iv(this.addr,i),bt(r,i));for(let a=0;a!==o;++a)t.setTextureCube(n[a]||Bu,i[a])}function Y_(e,n,t){let r=this.cache,o=n.length,i=Si(t,o);Tt(r,i)||(e.uniform1iv(this.addr,i),bt(r,i));for(let a=0;a!==o;++a)t.setTexture2DArray(n[a]||Fu,i[a])}function q_(e){switch(e){case 5126:return P_;case 35664:return L_;case 35665:return D_;case 35666:return U_;case 35674:return I_;case 35675:return N_;case 35676:return O_;case 5124:case 35670:return F_;case 35667:case 35671:return H_;case 35668:case 35672:return B_;case 35669:case 35673:return G_;case 5125:return k_;case 36294:return V_;case 36295:return z_;case 36296:return W_;case 35678:case 36198:case 36298:case 36306:case 35682:return X_;case 35679:case 36299:case 36307:return $_;case 35680:case 36300:case 36308:case 36293:return K_;case 36289:case 36303:case 36311:case 36292:return Y_}}var Os=class{constructor(n,t,r){this.id=n,this.addr=r,this.cache=[],this.type=t.type,this.setValue=C_(t.type)}},Fs=class{constructor(n,t,r){this.id=n,this.addr=r,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=q_(t.type)}},Hs=class{constructor(n){this.id=n,this.seq=[],this.map={}}setValue(n,t,r){let o=this.seq;for(let i=0,a=o.length;i!==a;++i){let s=o[i];s.setValue(n,t[s.id],r)}}},Us=/(\w+)(\])?(\[|\.)?/g;function Eu(e,n){e.seq.push(n),e.map[n.id]=n}function Z_(e,n,t){let r=e.name,o=r.length;for(Us.lastIndex=0;;){let i=Us.exec(r),a=Us.lastIndex,s=i[1],l=i[2]==="]",c=i[3];if(l&&(s=s|0),c===void 0||c==="["&&a+2===o){Eu(t,c===void 0?new Os(s,e,n):new Fs(s,e,n));break}else{let u=t.map[s];u===void 0&&(u=new Hs(s),Eu(t,u)),t=u}}}var Fr=class{constructor(n,t){this.seq=[],this.map={};let r=n.getProgramParameter(t,n.ACTIVE_UNIFORMS);for(let a=0;a<r;++a){let s=n.getActiveUniform(t,a),l=n.getUniformLocation(t,s.name);Z_(s,l,this)}let o=[],i=[];for(let a of this.seq)a.type===n.SAMPLER_2D_SHADOW||a.type===n.SAMPLER_CUBE_SHADOW||a.type===n.SAMPLER_2D_ARRAY_SHADOW?o.push(a):i.push(a);o.length>0&&(this.seq=o.concat(i))}setValue(n,t,r,o){let i=this.map[t];i!==void 0&&i.setValue(n,r,o)}setOptional(n,t,r){let o=t[r];o!==void 0&&this.setValue(n,r,o)}static upload(n,t,r,o){for(let i=0,a=t.length;i!==a;++i){let s=t[i],l=r[s.id];l.needsUpdate!==!1&&s.setValue(n,l.value,o)}}static seqWithValue(n,t){let r=[];for(let o=0,i=n.length;o!==i;++o){let a=n[o];a.id in t&&r.push(a)}return r}};function Mu(e,n,t){let r=e.createShader(n);return e.shaderSource(r,t),e.compileShader(r),r}var j_=37297,Q_=0;function J_(e,n){let t=e.split(`
`),r=[],o=Math.max(n-6,0),i=Math.min(n+6,t.length);for(let a=o;a<i;a++){let s=a+1;r.push(`${s===n?">":" "} ${s}: ${t[a]}`)}return r.join(`
`)}var Tu=new Be;function ev(e){ct._getMatrix(Tu,ct.workingColorSpace,e);let n=`mat3( ${Tu.elements.map(t=>t.toFixed(4))} )`;switch(ct.getTransfer(e)){case ls:return[n,"LinearTransferOETF"];case tt:return[n,"sRGBTransferOETF"];default:return qe("WebGLProgram: Unsupported color space: ",e),[n,"LinearTransferOETF"]}}function bu(e,n,t){let r=e.getShaderParameter(n,e.COMPILE_STATUS),i=(e.getShaderInfoLog(n)||"").trim();if(r&&i==="")return"";let a=/ERROR: 0:(\d+)/.exec(i);if(a){let s=parseInt(a[1]);return t.toUpperCase()+`

`+i+`

`+J_(e.getShaderSource(n),s)}else return i}function tv(e,n){let t=ev(n);return[`vec4 ${e}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var nv={[_a]:"Linear",[va]:"Reinhard",[Sa]:"Cineon",[xa]:"ACESFilmic",[Ma]:"AgX",[Ta]:"Neutral",[Ea]:"Custom"};function rv(e,n){let t=nv[n];return t===void 0?(qe("WebGLProgram: Unsupported toneMapping:",n),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+e+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var mi=new te;function ov(){ct.getLuminanceCoefficients(mi);let e=mi.x.toFixed(4),n=mi.y.toFixed(4),t=mi.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${n}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function iv(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(xo).join(`
`)}function av(e){let n=[];for(let t in e){let r=e[t];r!==!1&&n.push("#define "+t+" "+r)}return n.join(`
`)}function sv(e,n){let t={},r=e.getProgramParameter(n,e.ACTIVE_ATTRIBUTES);for(let o=0;o<r;o++){let i=e.getActiveAttrib(n,o),a=i.name,s=1;i.type===e.FLOAT_MAT2&&(s=2),i.type===e.FLOAT_MAT3&&(s=3),i.type===e.FLOAT_MAT4&&(s=4),t[a]={type:i.type,location:e.getAttribLocation(n,a),locationSize:s}}return t}function xo(e){return e!==""}function wu(e,n){let t=n.numSpotLightShadows+n.numSpotLightMaps-n.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,n.numSunLights).replace(/NUM_DIR_LIGHTS/g,n.numDirLights).replace(/NUM_SPOT_LIGHTS/g,n.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,n.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,n.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,n.numPointLights).replace(/NUM_HEMI_LIGHTS/g,n.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,n.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,n.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,n.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,n.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,n.numPointLightShadows)}function Au(e,n){return e.replace(/NUM_CLIPPING_PLANES/g,n.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,n.numClippingPlanes-n.numClipIntersection)}var lv=/^[ \t]*#include +<([\w\d./]+)>/gm;function Bs(e){return e.replace(lv,fv)}var cv=new Map;function fv(e,n){let t=Pe[n];if(t===void 0){let r=cv.get(n);if(r!==void 0)t=Pe[r],qe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',n,r);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+n+">")}return Bs(t)}var uv=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ru(e){return e.replace(uv,dv)}function dv(e,n,t,r){let o="";for(let i=parseInt(n);i<parseInt(t);i++)o+=r.replace(/\[\s*i\s*\]/g,"[ "+i+" ]").replace(/UNROLLED_LOOP_INDEX/g,i);return o}function yu(e){let n=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision==="highp"?n+=`
#define HIGH_PRECISION`:e.precision==="mediump"?n+=`
#define MEDIUM_PRECISION`:e.precision==="lowp"&&(n+=`
#define LOW_PRECISION`),n}var hv={[so]:"SHADOWMAP_TYPE_PCF",[Rr]:"SHADOWMAP_TYPE_VSM"};function pv(e){return hv[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var mv={[Pr]:"ENVMAP_TYPE_CUBE",[Jn]:"ENVMAP_TYPE_CUBE",[co]:"ENVMAP_TYPE_CUBE_UV"};function gv(e){return e.envMap===!1?"ENVMAP_TYPE_CUBE":mv[e.envMapMode]||"ENVMAP_TYPE_CUBE"}var _v={[Jn]:"ENVMAP_MODE_REFRACTION"};function vv(e){return e.envMap===!1?"ENVMAP_MODE_REFLECTION":_v[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}var Sv={[Sf]:"ENVMAP_BLENDING_MULTIPLY",[xf]:"ENVMAP_BLENDING_MIX",[Ef]:"ENVMAP_BLENDING_ADD"};function xv(e){return e.envMap===!1?"ENVMAP_BLENDING_NONE":Sv[e.combine]||"ENVMAP_BLENDING_NONE"}function Ev(e){let n=e.envMapCubeUVHeight;if(n===null)return null;let t=Math.log2(n)-2,r=1/n;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:r,maxMip:t}}function Mv(e,n,t,r){let o=e.getContext(),i=t.defines,a=t.vertexShader,s=t.fragmentShader,l=pv(t),c=gv(t),f=vv(t),u=xv(t),d=Ev(t),h=iv(t),_=av(i),T=o.createProgram(),p,m,v=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(xo).join(`
`),p.length>0&&(p+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(xo).join(`
`),m.length>0&&(m+=`
`)):(p=[yu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+f:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(xo).join(`
`),m=[yu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+f:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==cn?"#define TONE_MAPPING":"",t.toneMapping!==cn?Pe.tonemapping_pars_fragment:"",t.toneMapping!==cn?rv("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Pe.colorspace_pars_fragment,tv("linearToOutputTexel",t.outputColorSpace),ov(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(xo).join(`
`)),a=Bs(a),a=wu(a,t),a=Au(a,t),s=Bs(s),s=wu(s,t),s=Au(s,t),a=Ru(a),s=Ru(s),t.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,p=[h,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,m=["#define varying in",t.glslVersion===fs?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===fs?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let x=v+p+a,g=v+m+s,E=Mu(o,o.VERTEX_SHADER,x),b=Mu(o,o.FRAGMENT_SHADER,g);o.attachShader(T,E),o.attachShader(T,b),t.index0AttributeName!==void 0?o.bindAttribLocation(T,0,t.index0AttributeName):t.hasPositionAttribute===!0&&o.bindAttribLocation(T,0,"position"),o.linkProgram(T);function w(P){if(e.debug.checkShaderErrors){let D=o.getProgramInfoLog(T)||"",U=o.getShaderInfoLog(E)||"",L=o.getShaderInfoLog(b)||"",F=D.trim(),G=U.trim(),H=L.trim(),X=!0,$=!0;if(o.getProgramParameter(T,o.LINK_STATUS)===!1)if(X=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(o,T,E,b);else{let j=bu(o,E,"vertex"),Z=bu(o,b,"fragment");it("WebGLProgram: Shader Error "+o.getError()+" - VALIDATE_STATUS "+o.getProgramParameter(T,o.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+F+`
`+j+`
`+Z)}else F!==""?qe("WebGLProgram: Program Info Log:",F):(G===""||H==="")&&($=!1);$&&(P.diagnostics={runnable:X,programLog:F,vertexShader:{log:G,prefix:p},fragmentShader:{log:H,prefix:m}})}o.deleteShader(E),o.deleteShader(b),S=new Fr(o,T),A=sv(o,T)}let S;this.getUniforms=function(){return S===void 0&&w(this),S};let A;this.getAttributes=function(){return A===void 0&&w(this),A};let C=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return C===!1&&(C=o.getProgramParameter(T,j_)),C},this.destroy=function(){r.releaseStatesOfProgram(this),o.deleteProgram(T),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Q_++,this.cacheKey=n,this.usedTimes=1,this.program=T,this.vertexShader=E,this.fragmentShader=b,this}var Tv=0,Gs=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(n,t,r){let o=this._getShaderCacheForMaterial(n);return o.has(t)===!1&&(o.add(t),t.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(n){let t=this.materialCache.get(n);for(let r of t)r.usedTimes--,r.usedTimes===0&&this.shaderCache.delete(r.code);return this.materialCache.delete(n),this}getVertexShaderStage(n){return this._getShaderStage(n.vertexShader)}getFragmentShaderStage(n){return this._getShaderStage(n.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(n){let t=this.materialCache,r=t.get(n);return r===void 0&&(r=new Set,t.set(n,r)),r}_getShaderStage(n){let t=this.shaderCache,r=t.get(n);return r===void 0&&(r=new ks(n),t.set(n,r)),r}},ks=class{constructor(n){this.id=Tv++,this.code=n,this.usedTimes=0}};function bv(e){return e===nr||e===ii||e===ai}function wv(e,n,t,r,o,i){let a=new $f,s=new Gs,l=new Set,c=[],f=new Map,u=r.logarithmicDepthBuffer,d=r.precision,h={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(S){return l.add(S),S===0?"uv":`uv${S}`}function T(S,A,C,P,D,U){let L=P.fog,F=D.geometry,G=S.isMeshStandardMaterial||S.isMeshLambertMaterial||S.isMeshPhongMaterial?P.environment:null,H=S.isMeshStandardMaterial||S.isMeshLambertMaterial&&!S.envMap||S.isMeshPhongMaterial&&!S.envMap,X=n.get(S.envMap||G,H),$=X&&X.mapping===co?X.image.height:null,j=h[S.type];S.precision!==null&&(d=r.getMaxPrecision(S.precision),d!==S.precision&&qe("WebGLProgram.getParameters:",S.precision,"not supported, using",d,"instead."));let Z=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,ge=Z!==void 0?Z.length:0,_e=0;F.morphAttributes.position!==void 0&&(_e=1),F.morphAttributes.normal!==void 0&&(_e=2),F.morphAttributes.color!==void 0&&(_e=3);let ke,Xe,Ve,Y;if(j){let rt=nn[j];ke=rt.vertexShader,Xe=rt.fragmentShader}else{ke=S.vertexShader,Xe=S.fragmentShader;let rt=s.getVertexShaderStage(S),Ke=s.getFragmentShaderStage(S);s.update(S,rt,Ke),Ve=rt.id,Y=Ke.id}let J=e.getRenderTarget(),Ee=e.state.buffers.depth.getReversed(),Ue=D.isInstancedMesh===!0,ve=D.isBatchedMesh===!0,ze=!!S.map,Mt=!!S.matcap,Oe=!!X,$e=!!S.aoMap,nt=!!S.lightMap,He=!!S.bumpMap&&S.wireframe===!1,lt=!!S.normalMap,Rt=!!S.displacementMap,Bt=!!S.emissiveMap,ut=!!S.metalnessMap,_t=!!S.roughnessMap,O=S.anisotropy>0,Ut=S.clearcoat>0,Ze=S.dispersion>0,y=S.retroreflectivity>0,M=S.iridescence>0,B=S.sheen>0,z=S.transmission>0,K=O&&!!S.anisotropyMap,re=Ut&&!!S.clearcoatMap,oe=Ut&&!!S.clearcoatNormalMap,q=Ut&&!!S.clearcoatRoughnessMap,ee=M&&!!S.iridescenceMap,ie=M&&!!S.iridescenceThicknessMap,be=B&&!!S.sheenColorMap,fe=B&&!!S.sheenRoughnessMap,ae=!!S.specularMap,we=!!S.specularColorMap,Re=!!S.specularIntensityMap,Le=z&&!!S.transmissionMap,N=z&&!!S.thicknessMap,se=!!S.gradientMap,Q=!!S.alphaMap,le=S.alphaTest>0,he=!!S.alphaHash,ne=!!S.extensions,Ae=cn;S.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(Ae=e.toneMapping);let Me={shaderID:j,shaderType:S.type,shaderName:S.name,vertexShader:ke,fragmentShader:Xe,defines:S.defines,customVertexShaderID:Ve,customFragmentShaderID:Y,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:d,batching:ve,batchingColor:ve&&D._colorsTexture!==null,instancing:Ue,instancingColor:Ue&&D.instanceColor!==null,instancingMorph:Ue&&D.morphTexture!==null,outputColorSpace:J===null?e.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:ct.workingColorSpace,alphaToCoverage:!!S.alphaToCoverage,map:ze,matcap:Mt,envMap:Oe,envMapMode:Oe&&X.mapping,envMapCubeUVHeight:$,aoMap:$e,lightMap:nt,bumpMap:He,normalMap:lt,displacementMap:Rt,emissiveMap:Bt,normalMapObjectSpace:lt&&S.normalMapType===Pf,normalMapTangentSpace:lt&&S.normalMapType===as,packedNormalMap:lt&&S.normalMapType===as&&bv(S.normalMap.format),metalnessMap:ut,roughnessMap:_t,anisotropy:O,anisotropyMap:K,clearcoat:Ut,clearcoatMap:re,clearcoatNormalMap:oe,clearcoatRoughnessMap:q,dispersion:Ze,retroreflection:y,iridescence:M,iridescenceMap:ee,iridescenceThicknessMap:ie,sheen:B,sheenColorMap:be,sheenRoughnessMap:fe,specularMap:ae,specularColorMap:we,specularIntensityMap:Re,transmission:z,transmissionMap:Le,thicknessMap:N,gradientMap:se,opaque:S.transparent===!1&&S.blending===lo&&S.alphaToCoverage===!1,alphaMap:Q,alphaTest:le,alphaHash:he,combine:S.combine,mapUv:ze&&_(S.map.channel),aoMapUv:$e&&_(S.aoMap.channel),lightMapUv:nt&&_(S.lightMap.channel),bumpMapUv:He&&_(S.bumpMap.channel),normalMapUv:lt&&_(S.normalMap.channel),displacementMapUv:Rt&&_(S.displacementMap.channel),emissiveMapUv:Bt&&_(S.emissiveMap.channel),metalnessMapUv:ut&&_(S.metalnessMap.channel),roughnessMapUv:_t&&_(S.roughnessMap.channel),anisotropyMapUv:K&&_(S.anisotropyMap.channel),clearcoatMapUv:re&&_(S.clearcoatMap.channel),clearcoatNormalMapUv:oe&&_(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:q&&_(S.clearcoatRoughnessMap.channel),iridescenceMapUv:ee&&_(S.iridescenceMap.channel),iridescenceThicknessMapUv:ie&&_(S.iridescenceThicknessMap.channel),sheenColorMapUv:be&&_(S.sheenColorMap.channel),sheenRoughnessMapUv:fe&&_(S.sheenRoughnessMap.channel),specularMapUv:ae&&_(S.specularMap.channel),specularColorMapUv:we&&_(S.specularColorMap.channel),specularIntensityMapUv:Re&&_(S.specularIntensityMap.channel),transmissionMapUv:Le&&_(S.transmissionMap.channel),thicknessMapUv:N&&_(S.thicknessMap.channel),alphaMapUv:Q&&_(S.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(lt||O),vertexNormals:!!F.attributes.normal,vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:D.isPoints===!0&&!!F.attributes.uv&&(ze||Q),fog:!!L,useFog:S.fog===!0,fogExp2:!!L&&L.isFogExp2,flatShading:S.wireframe===!1&&(S.flatShading===!0||F.attributes.normal===void 0&&lt===!1&&(S.isMeshLambertMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isMeshPhysicalMaterial)),sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:Ee,skinning:D.isSkinnedMesh===!0,hasPositionAttribute:F.attributes.position!==void 0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:ge,morphTextureStride:_e,numSunLights:A.sun.length,numDirLights:A.directional.length,numPointLights:A.point.length,numSpotLights:A.spot.length,numSpotLightMaps:A.spotLightMap.length,numRectAreaLights:A.rectArea.length,numHemiLights:A.hemi.length,numSunLightShadows:A.sunShadowMap.length,numDirLightShadows:A.directionalShadowMap.length,numPointLightShadows:A.pointShadowMap.length,numSpotLightShadows:A.spotShadowMap.length,numSpotLightShadowsWithMaps:A.numSpotLightShadowsWithMaps,numLightProbes:A.numLightProbes,numLightProbeGrids:U.length,numClippingPlanes:i.numPlanes,numClipIntersection:i.numIntersection,dithering:S.dithering,shadowMapEnabled:e.shadowMap.enabled&&C.length>0,shadowMapType:e.shadowMap.type,toneMapping:Ae,decodeVideoTexture:ze&&S.map.isVideoTexture===!0&&ct.getTransfer(S.map.colorSpace)===tt,decodeVideoTextureEmissive:Bt&&S.emissiveMap.isVideoTexture===!0&&ct.getTransfer(S.emissiveMap.colorSpace)===tt,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===Qt,flipSided:S.side===kt,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionClipCullDistance:ne&&S.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ne&&S.extensions.multiDraw===!0||ve)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()};return Me.vertexUv1s=l.has(1),Me.vertexUv2s=l.has(2),Me.vertexUv3s=l.has(3),l.clear(),Me}function p(S){let A=[];if(S.shaderID?A.push(S.shaderID):(A.push(S.customVertexShaderID),A.push(S.customFragmentShaderID)),S.defines!==void 0)for(let C in S.defines)A.push(C),A.push(S.defines[C]);return S.isRawShaderMaterial===!1&&(m(A,S),v(A,S),A.push(e.outputColorSpace)),A.push(S.customProgramCacheKey),A.join()}function m(S,A){S.push(A.precision),S.push(A.outputColorSpace),S.push(A.envMapMode),S.push(A.envMapCubeUVHeight),S.push(A.mapUv),S.push(A.alphaMapUv),S.push(A.lightMapUv),S.push(A.aoMapUv),S.push(A.bumpMapUv),S.push(A.normalMapUv),S.push(A.displacementMapUv),S.push(A.emissiveMapUv),S.push(A.metalnessMapUv),S.push(A.roughnessMapUv),S.push(A.anisotropyMapUv),S.push(A.clearcoatMapUv),S.push(A.clearcoatNormalMapUv),S.push(A.clearcoatRoughnessMapUv),S.push(A.iridescenceMapUv),S.push(A.iridescenceThicknessMapUv),S.push(A.sheenColorMapUv),S.push(A.sheenRoughnessMapUv),S.push(A.specularMapUv),S.push(A.specularColorMapUv),S.push(A.specularIntensityMapUv),S.push(A.transmissionMapUv),S.push(A.thicknessMapUv),S.push(A.combine),S.push(A.fogExp2),S.push(A.sizeAttenuation),S.push(A.morphTargetsCount),S.push(A.morphAttributeCount),S.push(A.numSunLights),S.push(A.numDirLights),S.push(A.numPointLights),S.push(A.numSpotLights),S.push(A.numSpotLightMaps),S.push(A.numHemiLights),S.push(A.numRectAreaLights),S.push(A.numSunLightShadows),S.push(A.numDirLightShadows),S.push(A.numPointLightShadows),S.push(A.numSpotLightShadows),S.push(A.numSpotLightShadowsWithMaps),S.push(A.numLightProbes),S.push(A.shadowMapType),S.push(A.toneMapping),S.push(A.numClippingPlanes),S.push(A.numClipIntersection),S.push(A.depthPacking)}function v(S,A){a.disableAll(),A.instancing&&a.enable(0),A.instancingColor&&a.enable(1),A.instancingMorph&&a.enable(2),A.matcap&&a.enable(3),A.envMap&&a.enable(4),A.normalMapObjectSpace&&a.enable(5),A.normalMapTangentSpace&&a.enable(6),A.clearcoat&&a.enable(7),A.iridescence&&a.enable(8),A.alphaTest&&a.enable(9),A.vertexColors&&a.enable(10),A.vertexAlphas&&a.enable(11),A.vertexUv1s&&a.enable(12),A.vertexUv2s&&a.enable(13),A.vertexUv3s&&a.enable(14),A.vertexTangents&&a.enable(15),A.anisotropy&&a.enable(16),A.alphaHash&&a.enable(17),A.batching&&a.enable(18),A.dispersion&&a.enable(19),A.retroreflection&&a.enable(24),A.batchingColor&&a.enable(20),A.gradientMap&&a.enable(21),A.packedNormalMap&&a.enable(22),A.vertexNormals&&a.enable(23),S.push(a.mask),a.disableAll(),A.fog&&a.enable(0),A.useFog&&a.enable(1),A.flatShading&&a.enable(2),A.logarithmicDepthBuffer&&a.enable(3),A.reversedDepthBuffer&&a.enable(4),A.skinning&&a.enable(5),A.morphTargets&&a.enable(6),A.morphNormals&&a.enable(7),A.morphColors&&a.enable(8),A.premultipliedAlpha&&a.enable(9),A.shadowMapEnabled&&a.enable(10),A.doubleSided&&a.enable(11),A.flipSided&&a.enable(12),A.useDepthPacking&&a.enable(13),A.dithering&&a.enable(14),A.transmission&&a.enable(15),A.sheen&&a.enable(16),A.opaque&&a.enable(17),A.pointsUvs&&a.enable(18),A.decodeVideoTexture&&a.enable(19),A.decodeVideoTextureEmissive&&a.enable(20),A.alphaToCoverage&&a.enable(21),A.numLightProbeGrids>0&&a.enable(22),A.hasPositionAttribute&&a.enable(23),S.push(a.mask)}function x(S){let A=h[S.type],C;if(A){let P=nn[A];C=Qf.clone(P.uniforms)}else C=S.uniforms;return C}function g(S,A){let C=f.get(A);return C!==void 0?++C.usedTimes:(C=new Mv(e,A,S,o),c.push(C),f.set(A,C)),C}function E(S){if(--S.usedTimes===0){let A=c.indexOf(S);c[A]=c[c.length-1],c.pop(),f.delete(S.cacheKey),S.destroy()}}function b(S){s.remove(S)}function w(){s.dispose()}return{getParameters:T,getProgramCacheKey:p,getUniforms:x,acquireProgram:g,releaseProgram:E,releaseShaderCache:b,programs:c,dispose:w}}function Av(){let e=new WeakMap;function n(a){return e.has(a)}function t(a){let s=e.get(a);return s===void 0&&(s={},e.set(a,s)),s}function r(a){e.delete(a)}function o(a,s,l){e.get(a)[s]=l}function i(){e=new WeakMap}return{has:n,get:t,remove:r,update:o,dispose:i}}function Rv(e,n){return e.groupOrder!==n.groupOrder?e.groupOrder-n.groupOrder:e.renderOrder!==n.renderOrder?e.renderOrder-n.renderOrder:e.material.id!==n.material.id?e.material.id-n.material.id:e.materialVariant!==n.materialVariant?e.materialVariant-n.materialVariant:e.z!==n.z?e.z-n.z:e.id-n.id}function Cu(e,n){return e.groupOrder!==n.groupOrder?e.groupOrder-n.groupOrder:e.renderOrder!==n.renderOrder?e.renderOrder-n.renderOrder:e.z!==n.z?n.z-e.z:e.id-n.id}function Pu(){let e=[],n=0,t=[],r=[],o=[];function i(){n=0,t.length=0,r.length=0,o.length=0}function a(d){let h=0;return d.isInstancedMesh&&(h+=2),d.isSkinnedMesh&&(h+=1),h}function s(d,h,_,T,p,m){let v=e[n];return v===void 0?(v={id:d.id,object:d,geometry:h,material:_,materialVariant:a(d),groupOrder:T,renderOrder:d.renderOrder,z:p,group:m},e[n]=v):(v.id=d.id,v.object=d,v.geometry=h,v.material=_,v.materialVariant=a(d),v.groupOrder=T,v.renderOrder=d.renderOrder,v.z=p,v.group=m),n++,v}function l(d,h,_,T,p,m,v){v.reversedDepth===!0&&(p=-p);let x=s(d,h,_,T,p,m);_.transmission>0?r.push(x):_.transparent===!0?o.push(x):t.push(x)}function c(d,h,_,T,p,m){let v=s(d,h,_,T,p,m);_.transmission>0?r.unshift(v):_.transparent===!0?o.unshift(v):t.unshift(v)}function f(d,h){t.length>1&&t.sort(d||Rv),r.length>1&&r.sort(h||Cu),o.length>1&&o.sort(h||Cu)}function u(){for(let d=n,h=e.length;d<h;d++){let _=e[d];if(_.id===null)break;_.id=null,_.object=null,_.geometry=null,_.material=null,_.group=null}}return{opaque:t,transmissive:r,transparent:o,init:i,push:l,unshift:c,finish:u,sort:f}}function yv(){let e=new WeakMap;function n(r,o){let i=e.get(r),a;return i===void 0?(a=new Pu,e.set(r,[a])):o>=i.length?(a=new Pu,i.push(a)):a=i[o],a}function t(){e=new WeakMap}return{get:n,dispose:t}}function Cv(){let e={};return{get:function(n){if(e[n.id]!==void 0)return e[n.id];let t;switch(n.type){case"SunLight":case"DirectionalLight":t={direction:new te,color:new ye};break;case"SpotLight":t={position:new te,direction:new te,color:new ye,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new te,color:new ye,distance:0,decay:0};break;case"HemisphereLight":t={direction:new te,skyColor:new ye,groundColor:new ye};break;case"RectAreaLight":t={color:new ye,position:new te,halfWidth:new te,halfHeight:new te};break}return e[n.id]=t,t}}}function Pv(){let e={};return{get:function(n){if(e[n.id]!==void 0)return e[n.id];let t;switch(n.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[n.id]=t,t}}}var Lv=0;function Dv(e,n){return(n.castShadow?2:0)-(e.castShadow?2:0)+(n.map?1:0)-(e.map?1:0)}function Uv(e){let n=new Cv,t=Pv(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)r.probe.push(new te);let o=new te,i=new qt,a=new qt;function s(c){let f=0,u=0,d=0;for(let D=0;D<9;D++)r.probe[D].set(0,0,0);let h=0,_=0,T=0,p=0,m=0,v=0,x=0,g=0,E=0,b=0,w=0,S=0,A=0,C=0;c.sort(Dv);for(let D=0,U=c.length;D<U;D++){let L=c[D],F=L.color,G=L.intensity,H=L.distance,X=null;if(L.shadow&&L.shadow.map&&(L.shadow.map.texture.format===nr?X=L.shadow.map.texture:X=L.shadow.map.depthTexture||L.shadow.map.texture),L.isAmbientLight)f+=F.r*G,u+=F.g*G,d+=F.b*G;else if(L.isLightProbe){for(let $=0;$<9;$++)r.probe[$].addScaledVector(L.sh.coefficients[$],G);C++}else if(L.isSunLight){let $=n.get(L);if($.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let j=L.shadow,Z=t.get(L);Z.shadowIntensity=j.intensity,Z.shadowBias=j.bias,Z.shadowNormalBias=j.normalBias,Z.shadowRadius=j.radius,Z.shadowMapSize.copy(j.mapSize).multiply(j.getFrameExtents()),r.sunShadow[_]=Z,r.sunShadowMap[_]=X;let ge=j.getViewportCount();for(let _e=0;_e<ge;_e++)r.sunShadowMatrix[T+_e]=j.getMatrix(_e),r.sunShadowCascade[T+_e]=j._cascadeData[_e];T+=ge,_++}r.sun[h]=$,h++}else if(L.isDirectionalLight){let $=n.get(L);if($.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let j=L.shadow,Z=t.get(L);Z.shadowIntensity=j.intensity,Z.shadowBias=j.bias,Z.shadowNormalBias=j.normalBias,Z.shadowRadius=j.radius,Z.shadowMapSize=j.mapSize,r.directionalShadow[p]=Z,r.directionalShadowMap[p]=X,r.directionalShadowMatrix[p]=L.shadow.matrix,E++}r.directional[p]=$,p++}else if(L.isSpotLight){let $=n.get(L);$.position.setFromMatrixPosition(L.matrixWorld),$.color.copy(F).multiplyScalar(G),$.distance=H,$.coneCos=Math.cos(L.angle),$.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),$.decay=L.decay,r.spot[v]=$;let j=L.shadow;if(L.map&&(r.spotLightMap[S]=L.map,S++,j.updateMatrices(L),L.castShadow&&A++),r.spotLightMatrix[v]=j.matrix,L.castShadow){let Z=t.get(L);Z.shadowIntensity=j.intensity,Z.shadowBias=j.bias,Z.shadowNormalBias=j.normalBias,Z.shadowRadius=j.radius,Z.shadowMapSize=j.mapSize,r.spotShadow[v]=Z,r.spotShadowMap[v]=X,w++}v++}else if(L.isRectAreaLight){let $=n.get(L);$.color.copy(F).multiplyScalar(G),$.halfWidth.set(L.width*.5,0,0),$.halfHeight.set(0,L.height*.5,0),r.rectArea[x]=$,x++}else if(L.isPointLight){let $=n.get(L);if($.color.copy(L.color).multiplyScalar(L.intensity),$.distance=L.distance,$.decay=L.decay,L.castShadow){let j=L.shadow,Z=t.get(L);Z.shadowIntensity=j.intensity,Z.shadowBias=j.bias,Z.shadowNormalBias=j.normalBias,Z.shadowRadius=j.radius,Z.shadowMapSize=j.mapSize,Z.shadowCameraNear=j.camera.near,Z.shadowCameraFar=j.camera.far,r.pointShadow[m]=Z,r.pointShadowMap[m]=X,r.pointShadowMatrix[m]=L.shadow.matrix,b++}r.point[m]=$,m++}else if(L.isHemisphereLight){let $=n.get(L);$.skyColor.copy(L.color).multiplyScalar(G),$.groundColor.copy(L.groundColor).multiplyScalar(G),r.hemi[g]=$,g++}}x>0&&(e.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=ce.LTC_FLOAT_1,r.rectAreaLTC2=ce.LTC_FLOAT_2):(r.rectAreaLTC1=ce.LTC_HALF_1,r.rectAreaLTC2=ce.LTC_HALF_2)),r.ambient[0]=f,r.ambient[1]=u,r.ambient[2]=d;let P=r.hash;(P.sunLength!==h||P.directionalLength!==p||P.pointLength!==m||P.spotLength!==v||P.rectAreaLength!==x||P.hemiLength!==g||P.numSunShadows!==_||P.numDirectionalShadows!==E||P.numPointShadows!==b||P.numSpotShadows!==w||P.numSpotMaps!==S||P.numLightProbes!==C)&&(r.sun.length=h,r.directional.length=p,r.spot.length=v,r.rectArea.length=x,r.point.length=m,r.hemi.length=g,r.sunShadow.length=_,r.sunShadowMap.length=_,r.sunShadowMatrix.length=T,r.sunShadowCascade.length=T,r.directionalShadow.length=E,r.directionalShadowMap.length=E,r.directionalShadowMatrix.length=E,r.pointShadow.length=b,r.pointShadowMap.length=b,r.pointShadowMatrix.length=b,r.spotShadow.length=w,r.spotShadowMap.length=w,r.spotLightMatrix.length=w+S-A,r.spotLightMap.length=S,r.numSpotLightShadowsWithMaps=A,r.numLightProbes=C,P.sunLength=h,P.directionalLength=p,P.pointLength=m,P.spotLength=v,P.rectAreaLength=x,P.hemiLength=g,P.numSunShadows=_,P.numDirectionalShadows=E,P.numPointShadows=b,P.numSpotShadows=w,P.numSpotMaps=S,P.numLightProbes=C,r.version=Lv++)}function l(c,f){let u=0,d=0,h=0,_=0,T=0,p=0,m=f.matrixWorldInverse;for(let v=0,x=c.length;v<x;v++){let g=c[v];if(g.isSunLight){let E=r.sun[u];E.direction.setFromMatrixPosition(g.matrixWorld),E.direction.transformDirection(m),u++}else if(g.isDirectionalLight){let E=r.directional[d];E.direction.setFromMatrixPosition(g.matrixWorld),o.setFromMatrixPosition(g.target.matrixWorld),E.direction.sub(o),E.direction.transformDirection(m),d++}else if(g.isSpotLight){let E=r.spot[_];E.position.setFromMatrixPosition(g.matrixWorld),E.position.applyMatrix4(m),E.direction.setFromMatrixPosition(g.matrixWorld),o.setFromMatrixPosition(g.target.matrixWorld),E.direction.sub(o),E.direction.transformDirection(m),_++}else if(g.isRectAreaLight){let E=r.rectArea[T];E.position.setFromMatrixPosition(g.matrixWorld),E.position.applyMatrix4(m),a.identity(),i.copy(g.matrixWorld),i.premultiply(m),a.extractRotation(i),E.halfWidth.set(g.width*.5,0,0),E.halfHeight.set(0,g.height*.5,0),E.halfWidth.applyMatrix4(a),E.halfHeight.applyMatrix4(a),T++}else if(g.isPointLight){let E=r.point[h];E.position.setFromMatrixPosition(g.matrixWorld),E.position.applyMatrix4(m),h++}else if(g.isHemisphereLight){let E=r.hemi[p];E.direction.setFromMatrixPosition(g.matrixWorld),E.direction.transformDirection(m),p++}}}return{setup:s,setupView:l,state:r}}function Lu(e){let n=new Uv(e),t=[],r=[],o=[];function i(d){u.camera=d,t.length=0,r.length=0,o.length=0}function a(d){t.push(d)}function s(d){r.push(d)}function l(d){o.push(d)}function c(){n.setup(t)}function f(d){n.setupView(t,d)}let u={lightsArray:t,shadowsArray:r,lightProbeGridArray:o,camera:null,lights:n,transmissionRenderTarget:{},textureUnits:0};return{init:i,state:u,setupLights:c,setupLightsView:f,pushLight:a,pushShadow:s,pushLightProbeGrid:l}}function Iv(e){let n=new WeakMap;function t(o,i=0){let a=n.get(o),s;return a===void 0?(s=new Lu(e),n.set(o,[s])):i>=a.length?(s=new Lu(e),a.push(s)):s=a[i],s}function r(){n=new WeakMap}return{get:t,dispose:r}}var Nv=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Ov=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Fv=[new te(1,0,0),new te(-1,0,0),new te(0,1,0),new te(0,-1,0),new te(0,0,1),new te(0,0,-1)],Hv=[new te(0,-1,0),new te(0,-1,0),new te(0,0,1),new te(0,0,-1),new te(0,-1,0),new te(0,-1,0)],Du=new qt,So=new te,Is=new te;function Bv(e,n,t){let r=new gs,o=new je,i=new je,a=new Lt,s=new eu,l=new tu,c={},f=t.maxTextureSize,u={[yr]:kt,[kt]:yr,[Qt]:Qt},d=new tn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new je},radius:{value:4}},vertexShader:Nv,fragmentShader:Ov}),h=d.clone();h.defines.HORIZONTAL_PASS=1;let _=new xt;_.setAttribute("position",new Ie(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let T=new yt(_,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=so;let m=this.type;this.render=function(b,w,S){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||b.length===0)return;this.type===Wc&&(qe("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=so);let A=e.getRenderTarget(),C=e.getActiveCubeFace(),P=e.getActiveMipmapLevel(),D=e.state;D.setBlending(Sn),D.buffers.depth.getReversed()===!0?D.buffers.color.setClear(0,0,0,0):D.buffers.color.setClear(1,1,1,1),D.buffers.depth.setTest(!0),D.setScissorTest(!1);let U=m!==this.type;U&&w.traverse(function(L){L.material&&(Array.isArray(L.material)?L.material.forEach(F=>F.needsUpdate=!0):L.material.needsUpdate=!0)});for(let L=0,F=b.length;L<F;L++){let G=b[L],H=G.shadow;if(H===void 0){qe("WebGLShadowMap:",G,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;o.copy(H.mapSize);let X=H.getFrameExtents();o.multiply(X),i.copy(H.mapSize),(o.x>f||o.y>f)&&(o.x>f&&(i.x=Math.floor(f/X.x),o.x=i.x*X.x,H.mapSize.x=i.x),o.y>f&&(i.y=Math.floor(f/X.y),o.y=i.y*X.y,H.mapSize.y=i.y));let $=e.state.buffers.depth.getReversed();if(H.camera._reversedDepth=$,H.map===null||U===!0){if(H.map!==null&&(H.map.depthTexture!==null&&(H.map.depthTexture.dispose(),H.map.depthTexture=null),H.map.dispose()),this.type===Rr){if(G.isPointLight){qe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}H.map=new en(o.x,o.y,{format:nr,type:xn,minFilter:St,magFilter:St,generateMipmaps:!1}),H.map.texture.name=G.name+".shadowMap",H.map.depthTexture=new po(o.x,o.y,Cn),H.map.depthTexture.name=G.name+".shadowMapDepth",H.map.depthTexture.format=er,H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=Hn,H.map.depthTexture.magFilter=Hn}else G.isPointLight?(H.map=new _i(o.x),H.map.depthTexture=new jf(o.x,Bn)):(H.map=new en(o.x,o.y),H.map.depthTexture=new po(o.x,o.y,Bn)),H.map.depthTexture.name=G.name+".shadowMap",H.map.depthTexture.format=er,this.type===so?(H.map.depthTexture.compareFunction=$?li:si,H.map.depthTexture.minFilter=St,H.map.depthTexture.magFilter=St):(H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=Hn,H.map.depthTexture.magFilter=Hn);H.camera.updateProjectionMatrix()}H.map.isWebGLCubeRenderTarget!==!0&&(H.map.width!==o.x||H.map.height!==o.y)&&H.map.setSize(o.x,o.y);let j=H.map.isWebGLCubeRenderTarget?6:H.getViewportCount();G.isPointLight!==!0&&H.updateMatrices(G,S);for(let Z=0;Z<j;Z++){let ge=H.getCamera(Z);if(G.isPointLight){let _e=H.camera,ke=H.matrix,Xe=G.distance||_e.far;Xe!==_e.far&&(_e.far=Xe,_e.updateProjectionMatrix()),So.setFromMatrixPosition(G.matrixWorld),_e.position.copy(So),Is.copy(_e.position),Is.add(Fv[Z]),_e.up.copy(Hv[Z]),_e.lookAt(Is),_e.updateMatrixWorld(),ke.makeTranslation(-So.x,-So.y,-So.z),Du.multiplyMatrices(_e.projectionMatrix,_e.matrixWorldInverse),H._frustum.setFromProjectionMatrix(Du,_e.coordinateSystem,_e.reversedDepth)}if(H.map.isWebGLCubeRenderTarget)e.setRenderTarget(H.map,Z),e.clear();else{Z===0&&(e.setRenderTarget(H.map),e.clear());let _e=H.getViewport(Z);a.set(i.x*_e.x,i.y*_e.y,i.x*_e.z,i.y*_e.w),D.viewport(a)}r=H.getFrustum(Z),g(w,S,ge,G,this.type)}H.isPointLightShadow!==!0&&this.type===Rr&&v(H,S),H.needsUpdate=!1}m=this.type,p.needsUpdate=!1,e.setRenderTarget(A,C,P)};function v(b,w){let S=n.update(T);d.defines.VSM_SAMPLES!==b.blurSamples&&(d.defines.VSM_SAMPLES=b.blurSamples,h.defines.VSM_SAMPLES=b.blurSamples,d.needsUpdate=!0,h.needsUpdate=!0),b.mapPass===null?b.mapPass=new en(o.x,o.y,{format:nr,type:xn}):(b.mapPass.width!==b.map.width||b.mapPass.height!==b.map.height)&&b.mapPass.setSize(b.map.width,b.map.height),d.uniforms.shadow_pass.value=b.map.depthTexture,d.uniforms.resolution.value.set(b.map.width,b.map.height),d.uniforms.radius.value=b.radius,e.setRenderTarget(b.mapPass),e.clear(),e.renderBufferDirect(w,null,S,d,T,null),h.uniforms.shadow_pass.value=b.mapPass.texture,h.uniforms.resolution.value.set(b.map.width,b.map.height),h.uniforms.radius.value=b.radius,e.setRenderTarget(b.map),e.clear(),e.renderBufferDirect(w,null,S,h,T,null)}function x(b,w,S,A){let C=null,P=S.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(P!==void 0)C=P;else if(C=S.isPointLight===!0?l:s,e.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0||w.alphaToCoverage===!0){let D=C.uuid,U=w.uuid,L=c[D];L===void 0&&(L={},c[D]=L);let F=L[U];F===void 0&&(F=C.clone(),L[U]=F,w.addEventListener("dispose",E)),C=F}if(C.visible=w.visible,C.wireframe=w.wireframe,A===Rr?C.side=w.shadowSide!==null?w.shadowSide:w.side:C.side=w.shadowSide!==null?w.shadowSide:u[w.side],C.alphaMap=w.alphaMap,C.alphaTest=w.alphaToCoverage===!0?.5:w.alphaTest,C.map=w.map,C.clipShadows=w.clipShadows,C.clippingPlanes=w.clippingPlanes,C.clipIntersection=w.clipIntersection,C.displacementMap=w.displacementMap,C.displacementScale=w.displacementScale,C.displacementBias=w.displacementBias,C.wireframeLinewidth=w.wireframeLinewidth,C.linewidth=w.linewidth,S.isPointLight===!0&&C.isMeshDistanceMaterial===!0){let D=e.properties.get(C);D.light=S}return C}function g(b,w,S,A,C){if(b.visible===!1)return;if(b.layers.test(w.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&C===Rr)&&(!b.frustumCulled||b.intersectsFrustum(r))){b.modelViewMatrix.multiplyMatrices(S.matrixWorldInverse,b.matrixWorld);let U=n.update(b),L=b.material;if(Array.isArray(L)){let F=U.groups;for(let G=0,H=F.length;G<H;G++){let X=F[G],$=L[X.materialIndex];if($&&$.visible){let j=x(b,$,A,C);b.onBeforeShadow(e,b,w,S,U,j,X),e.renderBufferDirect(S,null,U,j,b,X),b.onAfterShadow(e,b,w,S,U,j,X)}}}else if(L.visible){let F=x(b,L,A,C);b.onBeforeShadow(e,b,w,S,U,F,null),e.renderBufferDirect(S,null,U,F,b,null),b.onAfterShadow(e,b,w,S,U,F,null)}}let D=b.children;for(let U=0,L=D.length;U<L;U++)g(D[U],w,S,A,C)}function E(b){b.target.removeEventListener("dispose",E);for(let S in c){let A=c[S],C=b.target.uuid;C in A&&(A[C].dispose(),delete A[C])}}}function Gv(e,n){function t(){let N=!1,se=new Lt,Q=null,le=new Lt(0,0,0,0);return{setMask:function(he){Q!==he&&!N&&(e.colorMask(he,he,he,he),Q=he)},setLocked:function(he){N=he},setClear:function(he,ne,Ae,Me,rt){rt===!0&&(he*=Me,ne*=Me,Ae*=Me),se.set(he,ne,Ae,Me),le.equals(se)===!1&&(e.clearColor(he,ne,Ae,Me),le.copy(se))},reset:function(){N=!1,Q=null,le.set(-1,0,0,0)}}}function r(){let N=!1,se=!1,Q=null,le=null,he=null;return{setReversed:function(ne){if(se!==ne){let Ae=n.get("EXT_clip_control");ne?Ae.clipControlEXT(Ae.LOWER_LEFT_EXT,Ae.ZERO_TO_ONE_EXT):Ae.clipControlEXT(Ae.LOWER_LEFT_EXT,Ae.NEGATIVE_ONE_TO_ONE_EXT),se=ne;let Me=he;he=null,this.setClear(Me)}},getReversed:function(){return se},setTest:function(ne){ne?J(e.DEPTH_TEST):Ee(e.DEPTH_TEST)},setMask:function(ne){Q!==ne&&!N&&(e.depthMask(ne),Q=ne)},setFunc:function(ne){if(se&&(ne=kf[ne]),le!==ne){switch(ne){case df:e.depthFunc(e.NEVER);break;case hf:e.depthFunc(e.ALWAYS);break;case pf:e.depthFunc(e.LESS);break;case ga:e.depthFunc(e.LEQUAL);break;case mf:e.depthFunc(e.EQUAL);break;case gf:e.depthFunc(e.GEQUAL);break;case _f:e.depthFunc(e.GREATER);break;case vf:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}le=ne}},setLocked:function(ne){N=ne},setClear:function(ne){he!==ne&&(he=ne,se&&(ne=1-ne),e.clearDepth(ne))},reset:function(){N=!1,Q=null,le=null,he=null,se=!1}}}function o(){let N=!1,se=null,Q=null,le=null,he=null,ne=null,Ae=null,Me=null,rt=null;return{setTest:function(Ke){N||(Ke?J(e.STENCIL_TEST):Ee(e.STENCIL_TEST))},setMask:function(Ke){se!==Ke&&!N&&(e.stencilMask(Ke),se=Ke)},setFunc:function(Ke,ln,_n){(Q!==Ke||le!==ln||he!==_n)&&(e.stencilFunc(Ke,ln,_n),Q=Ke,le=ln,he=_n)},setOp:function(Ke,ln,_n){(ne!==Ke||Ae!==ln||Me!==_n)&&(e.stencilOp(Ke,ln,_n),ne=Ke,Ae=ln,Me=_n)},setLocked:function(Ke){N=Ke},setClear:function(Ke){rt!==Ke&&(e.clearStencil(Ke),rt=Ke)},reset:function(){N=!1,se=null,Q=null,le=null,he=null,ne=null,Ae=null,Me=null,rt=null}}}let i=new t,a=new r,s=new o,l=new WeakMap,c=new WeakMap,f={},u={},d={},h=new WeakMap,_=[],T=null,p=!1,m=null,v=null,x=null,g=null,E=null,b=null,w=null,S=new ye(0,0,0),A=0,C=!1,P=null,D=null,U=null,L=null,F=null,G=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),H=!1,X=0,$=e.getParameter(e.VERSION);$.indexOf("WebGL")!==-1?(X=parseFloat(/^WebGL (\d)/.exec($)[1]),H=X>=1):$.indexOf("OpenGL ES")!==-1&&(X=parseFloat(/^OpenGL ES (\d)/.exec($)[1]),H=X>=2);let j=null,Z={},ge=e.getParameter(e.SCISSOR_BOX),_e=e.getParameter(e.VIEWPORT),ke=new Lt().fromArray(ge),Xe=new Lt().fromArray(_e);function Ve(N,se,Q,le){let he=new Uint8Array(4),ne=e.createTexture();e.bindTexture(N,ne),e.texParameteri(N,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(N,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let Ae=0;Ae<Q;Ae++)N===e.TEXTURE_3D||N===e.TEXTURE_2D_ARRAY?e.texImage3D(se,0,e.RGBA,1,1,le,0,e.RGBA,e.UNSIGNED_BYTE,he):e.texImage2D(se+Ae,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,he);return ne}let Y={};Y[e.TEXTURE_2D]=Ve(e.TEXTURE_2D,e.TEXTURE_2D,1),Y[e.TEXTURE_CUBE_MAP]=Ve(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),Y[e.TEXTURE_2D_ARRAY]=Ve(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),Y[e.TEXTURE_3D]=Ve(e.TEXTURE_3D,e.TEXTURE_3D,1,1),i.setClear(0,0,0,1),a.setClear(1),s.setClear(0),J(e.DEPTH_TEST),a.setFunc(ga),He(!1),lt(da),J(e.CULL_FACE),$e(Sn);function J(N){f[N]!==!0&&(e.enable(N),f[N]=!0)}function Ee(N){f[N]!==!1&&(e.disable(N),f[N]=!1)}function Ue(N,se){return d[N]!==se?(e.bindFramebuffer(N,se),d[N]=se,N===e.DRAW_FRAMEBUFFER&&(d[e.FRAMEBUFFER]=se),N===e.FRAMEBUFFER&&(d[e.DRAW_FRAMEBUFFER]=se),!0):!1}function ve(N,se){let Q=_,le=!1;if(N){Q=h.get(se),Q===void 0&&(Q=[],h.set(se,Q));let he=N.textures;if(Q.length!==he.length||Q[0]!==e.COLOR_ATTACHMENT0){for(let ne=0,Ae=he.length;ne<Ae;ne++)Q[ne]=e.COLOR_ATTACHMENT0+ne;Q.length=he.length,le=!0}}else Q[0]!==e.BACK&&(Q[0]=e.BACK,le=!0);le&&e.drawBuffers(Q)}function ze(N){return T!==N?(e.useProgram(N),T=N,!0):!1}let Mt={[Cr]:e.FUNC_ADD,[$c]:e.FUNC_SUBTRACT,[Kc]:e.FUNC_REVERSE_SUBTRACT};Mt[Yc]=e.MIN,Mt[qc]=e.MAX;let Oe={[Zc]:e.ZERO,[jc]:e.ONE,[Qc]:e.SRC_COLOR,[ef]:e.SRC_ALPHA,[sf]:e.SRC_ALPHA_SATURATE,[of]:e.DST_COLOR,[nf]:e.DST_ALPHA,[Jc]:e.ONE_MINUS_SRC_COLOR,[tf]:e.ONE_MINUS_SRC_ALPHA,[af]:e.ONE_MINUS_DST_COLOR,[rf]:e.ONE_MINUS_DST_ALPHA,[lf]:e.CONSTANT_COLOR,[cf]:e.ONE_MINUS_CONSTANT_COLOR,[ff]:e.CONSTANT_ALPHA,[uf]:e.ONE_MINUS_CONSTANT_ALPHA};function $e(N,se,Q,le,he,ne,Ae,Me,rt,Ke){if(N===Sn){p===!0&&(Ee(e.BLEND),p=!1);return}if(p===!1&&(J(e.BLEND),p=!0),N!==Xc){if(N!==m||Ke!==C){if((v!==Cr||E!==Cr)&&(e.blendEquation(e.FUNC_ADD),v=Cr,E=Cr),Ke)switch(N){case lo:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case ha:e.blendFunc(e.ONE,e.ONE);break;case pa:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case ma:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:it("WebGLState: Invalid blending: ",N);break}else switch(N){case lo:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case ha:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case pa:it("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case ma:it("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:it("WebGLState: Invalid blending: ",N);break}x=null,g=null,b=null,w=null,S.set(0,0,0),A=0,m=N,C=Ke}return}he=he||se,ne=ne||Q,Ae=Ae||le,(se!==v||he!==E)&&(e.blendEquationSeparate(Mt[se],Mt[he]),v=se,E=he),(Q!==x||le!==g||ne!==b||Ae!==w)&&(e.blendFuncSeparate(Oe[Q],Oe[le],Oe[ne],Oe[Ae]),x=Q,g=le,b=ne,w=Ae),(Me.equals(S)===!1||rt!==A)&&(e.blendColor(Me.r,Me.g,Me.b,rt),S.copy(Me),A=rt),m=N,C=!1}function nt(N,se){N.side===Qt?Ee(e.CULL_FACE):J(e.CULL_FACE);let Q=N.side===kt;se&&(Q=!Q),He(Q),N.blending===lo&&N.transparent===!1?$e(Sn):$e(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),a.setFunc(N.depthFunc),a.setTest(N.depthTest),a.setMask(N.depthWrite),i.setMask(N.colorWrite);let le=N.stencilWrite;s.setTest(le),le&&(s.setMask(N.stencilWriteMask),s.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),s.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),Bt(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?J(e.SAMPLE_ALPHA_TO_COVERAGE):Ee(e.SAMPLE_ALPHA_TO_COVERAGE)}function He(N){P!==N&&(N?e.frontFace(e.CW):e.frontFace(e.CCW),P=N)}function lt(N){N!==Vc?(J(e.CULL_FACE),N!==D&&(N===da?e.cullFace(e.BACK):N===zc?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):Ee(e.CULL_FACE),D=N}function Rt(N){N!==U&&(H&&e.lineWidth(N),U=N)}function Bt(N,se,Q){N?(J(e.POLYGON_OFFSET_FILL),(L!==se||F!==Q)&&(L=se,F=Q,a.getReversed()&&(se=-se),e.polygonOffset(se,Q))):Ee(e.POLYGON_OFFSET_FILL)}function ut(N){N?J(e.SCISSOR_TEST):Ee(e.SCISSOR_TEST)}function _t(N){N===void 0&&(N=e.TEXTURE0+G-1),j!==N&&(e.activeTexture(N),j=N)}function O(N,se,Q){Q===void 0&&(j===null?Q=e.TEXTURE0+G-1:Q=j);let le=Z[Q];le===void 0&&(le={type:void 0,texture:void 0},Z[Q]=le),(le.type!==N||le.texture!==se)&&(j!==Q&&(e.activeTexture(Q),j=Q),e.bindTexture(N,se||Y[N]),le.type=N,le.texture=se)}function Ut(){let N=Z[j];N!==void 0&&N.type!==void 0&&(e.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function Ze(){try{e.compressedTexImage2D(...arguments)}catch(N){it("WebGLState:",N)}}function y(){try{e.compressedTexImage3D(...arguments)}catch(N){it("WebGLState:",N)}}function M(){try{e.texSubImage2D(...arguments)}catch(N){it("WebGLState:",N)}}function B(){try{e.texSubImage3D(...arguments)}catch(N){it("WebGLState:",N)}}function z(){try{e.compressedTexSubImage2D(...arguments)}catch(N){it("WebGLState:",N)}}function K(){try{e.compressedTexSubImage3D(...arguments)}catch(N){it("WebGLState:",N)}}function re(){try{e.texStorage2D(...arguments)}catch(N){it("WebGLState:",N)}}function oe(){try{e.texStorage3D(...arguments)}catch(N){it("WebGLState:",N)}}function q(){try{e.texImage2D(...arguments)}catch(N){it("WebGLState:",N)}}function ee(){try{e.texImage3D(...arguments)}catch(N){it("WebGLState:",N)}}function ie(N){return u[N]!==void 0?u[N]:e.getParameter(N)}function be(N,se){u[N]!==se&&(e.pixelStorei(N,se),u[N]=se)}function fe(N){ke.equals(N)===!1&&(e.scissor(N.x,N.y,N.z,N.w),ke.copy(N))}function ae(N){Xe.equals(N)===!1&&(e.viewport(N.x,N.y,N.z,N.w),Xe.copy(N))}function we(N,se){let Q=c.get(se);Q===void 0&&(Q=new WeakMap,c.set(se,Q));let le=Q.get(N);le===void 0&&(le=e.getUniformBlockIndex(se,N.name),Q.set(N,le))}function Re(N,se){let le=c.get(se).get(N);l.get(se)!==le&&(e.uniformBlockBinding(se,le,N.__bindingPointIndex),l.set(se,le))}function Le(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),a.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),f={},u={},j=null,Z={},d={},h=new WeakMap,_=[],T=null,p=!1,m=null,v=null,x=null,g=null,E=null,b=null,w=null,S=new ye(0,0,0),A=0,C=!1,P=null,D=null,U=null,L=null,F=null,ke.set(0,0,e.canvas.width,e.canvas.height),Xe.set(0,0,e.canvas.width,e.canvas.height),i.reset(),a.reset(),s.reset()}return{buffers:{color:i,depth:a,stencil:s},enable:J,disable:Ee,bindFramebuffer:Ue,drawBuffers:ve,useProgram:ze,setBlending:$e,setMaterial:nt,setFlipSided:He,setCullFace:lt,setLineWidth:Rt,setPolygonOffset:Bt,setScissorTest:ut,activeTexture:_t,bindTexture:O,unbindTexture:Ut,compressedTexImage2D:Ze,compressedTexImage3D:y,texImage2D:q,texImage3D:ee,pixelStorei:be,getParameter:ie,updateUBOMapping:we,uniformBlockBinding:Re,texStorage2D:re,texStorage3D:oe,texSubImage2D:M,texSubImage3D:B,compressedTexSubImage2D:z,compressedTexSubImage3D:K,scissor:fe,viewport:ae,reset:Le}}function kv(e,n,t,r,o,i,a){let s=n.has("WEBGL_multisampled_render_to_texture")?n.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new je,f=new WeakMap,u=new Set,d,h=new WeakMap,_=!1;try{_=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function T(y,M){return _?new OffscreenCanvas(y,M):Ff("canvas")}function p(y,M,B){let z=1,K=Ze(y);if((K.width>B||K.height>B)&&(z=B/Math.max(K.width,K.height)),z<1)if(typeof HTMLImageElement<"u"&&y instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&y instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&y instanceof ImageBitmap||typeof VideoFrame<"u"&&y instanceof VideoFrame){let re=Math.floor(z*K.width),oe=Math.floor(z*K.height);d===void 0&&(d=T(re,oe));let q=M?T(re,oe):d;return q.width=re,q.height=oe,q.getContext("2d").drawImage(y,0,0,re,oe),qe("WebGLRenderer: Texture has been resized from ("+K.width+"x"+K.height+") to ("+re+"x"+oe+")."),q}else return"data"in y&&qe("WebGLRenderer: Image in DataTexture is too big ("+K.width+"x"+K.height+")."),y;return y}function m(y){return y.generateMipmaps}function v(y){e.generateMipmap(y)}function x(y){return y.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:y.isWebGL3DRenderTarget?e.TEXTURE_3D:y.isWebGLArrayRenderTarget||y.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function g(y,M,B,z,K,re=!1){if(y!==null){if(e[y]!==void 0)return e[y];qe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+y+"'")}let oe;z&&(oe=n.get("EXT_texture_norm16"),oe||qe("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let q=M;if(M===e.RED&&(B===e.FLOAT&&(q=e.R32F),B===e.HALF_FLOAT&&(q=e.R16F),B===e.UNSIGNED_BYTE&&(q=e.R8),B===e.UNSIGNED_SHORT&&oe&&(q=oe.R16_EXT),B===e.SHORT&&oe&&(q=oe.R16_SNORM_EXT)),M===e.RED_INTEGER&&(B===e.UNSIGNED_BYTE&&(q=e.R8UI),B===e.UNSIGNED_SHORT&&(q=e.R16UI),B===e.UNSIGNED_INT&&(q=e.R32UI),B===e.BYTE&&(q=e.R8I),B===e.SHORT&&(q=e.R16I),B===e.INT&&(q=e.R32I)),M===e.RG&&(B===e.FLOAT&&(q=e.RG32F),B===e.HALF_FLOAT&&(q=e.RG16F),B===e.UNSIGNED_BYTE&&(q=e.RG8),B===e.UNSIGNED_SHORT&&oe&&(q=oe.RG16_EXT),B===e.SHORT&&oe&&(q=oe.RG16_SNORM_EXT)),M===e.RG_INTEGER&&(B===e.UNSIGNED_BYTE&&(q=e.RG8UI),B===e.UNSIGNED_SHORT&&(q=e.RG16UI),B===e.UNSIGNED_INT&&(q=e.RG32UI),B===e.BYTE&&(q=e.RG8I),B===e.SHORT&&(q=e.RG16I),B===e.INT&&(q=e.RG32I)),M===e.RGB_INTEGER&&(B===e.UNSIGNED_BYTE&&(q=e.RGB8UI),B===e.UNSIGNED_SHORT&&(q=e.RGB16UI),B===e.UNSIGNED_INT&&(q=e.RGB32UI),B===e.BYTE&&(q=e.RGB8I),B===e.SHORT&&(q=e.RGB16I),B===e.INT&&(q=e.RGB32I)),M===e.RGBA_INTEGER&&(B===e.UNSIGNED_BYTE&&(q=e.RGBA8UI),B===e.UNSIGNED_SHORT&&(q=e.RGBA16UI),B===e.UNSIGNED_INT&&(q=e.RGBA32UI),B===e.BYTE&&(q=e.RGBA8I),B===e.SHORT&&(q=e.RGBA16I),B===e.INT&&(q=e.RGBA32I)),M===e.RGB&&(B===e.UNSIGNED_SHORT&&oe&&(q=oe.RGB16_EXT),B===e.SHORT&&oe&&(q=oe.RGB16_SNORM_EXT),B===e.UNSIGNED_INT_5_9_9_9_REV&&(q=e.RGB9_E5),B===e.UNSIGNED_INT_10F_11F_11F_REV&&(q=e.R11F_G11F_B10F)),M===e.RGBA){let ee=re?ls:ct.getTransfer(K);B===e.FLOAT&&(q=e.RGBA32F),B===e.HALF_FLOAT&&(q=e.RGBA16F),B===e.UNSIGNED_BYTE&&(q=ee===tt?e.SRGB8_ALPHA8:e.RGBA8),B===e.UNSIGNED_SHORT&&oe&&(q=oe.RGBA16_EXT),B===e.SHORT&&oe&&(q=oe.RGBA16_SNORM_EXT),B===e.UNSIGNED_SHORT_4_4_4_4&&(q=e.RGBA4),B===e.UNSIGNED_SHORT_5_5_5_1&&(q=e.RGB5_A1)}return(q===e.R16F||q===e.R32F||q===e.RG16F||q===e.RG32F||q===e.RGBA16F||q===e.RGBA32F)&&n.get("EXT_color_buffer_float"),q}function E(y,M){let B;return y?M===null||M===Bn||M===Lr?B=e.DEPTH24_STENCIL8:M===Cn?B=e.DEPTH32F_STENCIL8:M===uo&&(B=e.DEPTH24_STENCIL8,qe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):M===null||M===Bn||M===Lr?B=e.DEPTH_COMPONENT24:M===Cn?B=e.DEPTH_COMPONENT32F:M===uo&&(B=e.DEPTH_COMPONENT16),B}function b(y,M){return m(y)===!0||y.isFramebufferTexture&&y.minFilter!==Hn&&y.minFilter!==St?Math.log2(Math.max(M.width,M.height))+1:y.mipmaps!==void 0&&y.mipmaps.length>0?y.mipmaps.length:y.isCompressedTexture&&Array.isArray(y.image)?M.mipmaps.length:1}function w(y){let M=y.target;M.removeEventListener("dispose",w),A(M),M.isVideoTexture&&f.delete(M),M.isHTMLTexture&&u.delete(M)}function S(y){let M=y.target;M.removeEventListener("dispose",S),P(M)}function A(y){let M=r.get(y);if(M.__webglInit===void 0)return;let B=y.source,z=h.get(B);if(z){let K=z[M.__cacheKey];K.usedTimes--,K.usedTimes===0&&C(y),Object.keys(z).length===0&&h.delete(B)}r.remove(y)}function C(y){let M=r.get(y);e.deleteTexture(M.__webglTexture);let B=y.source,z=h.get(B);delete z[M.__cacheKey],a.memory.textures--}function P(y){let M=r.get(y);if(y.depthTexture&&(y.depthTexture.dispose(),r.remove(y.depthTexture)),y.isWebGLCubeRenderTarget)for(let z=0;z<6;z++){if(Array.isArray(M.__webglFramebuffer[z]))for(let K=0;K<M.__webglFramebuffer[z].length;K++)e.deleteFramebuffer(M.__webglFramebuffer[z][K]);else e.deleteFramebuffer(M.__webglFramebuffer[z]);M.__webglDepthbuffer&&e.deleteRenderbuffer(M.__webglDepthbuffer[z])}else{if(Array.isArray(M.__webglFramebuffer))for(let z=0;z<M.__webglFramebuffer.length;z++)e.deleteFramebuffer(M.__webglFramebuffer[z]);else e.deleteFramebuffer(M.__webglFramebuffer);if(M.__webglDepthbuffer&&e.deleteRenderbuffer(M.__webglDepthbuffer),M.__webglMultisampledFramebuffer&&e.deleteFramebuffer(M.__webglMultisampledFramebuffer),M.__webglColorRenderbuffer)for(let z=0;z<M.__webglColorRenderbuffer.length;z++)M.__webglColorRenderbuffer[z]&&e.deleteRenderbuffer(M.__webglColorRenderbuffer[z]);M.__webglDepthRenderbuffer&&e.deleteRenderbuffer(M.__webglDepthRenderbuffer)}let B=y.textures;for(let z=0,K=B.length;z<K;z++){let re=r.get(B[z]);re.__webglTexture&&(e.deleteTexture(re.__webglTexture),a.memory.textures--),r.remove(B[z])}r.remove(y)}let D=0;function U(){D=0}function L(){return D}function F(y){D=y}function G(){let y=D;return y>=o.maxTextures&&qe("WebGLTextures: Trying to use "+(y+1)+" texture units while this GPU supports only "+o.maxTextures),D+=1,y}function H(y){let M=[];return M.push(y.wrapS),M.push(y.wrapT),M.push(y.wrapR||0),M.push(y.magFilter),M.push(y.minFilter),M.push(y.anisotropy),M.push(y.internalFormat),M.push(y.format),M.push(y.type),M.push(y.generateMipmaps),M.push(y.premultiplyAlpha),M.push(y.flipY),M.push(y.unpackAlignment),M.push(y.colorSpace),M.join()}function X(y,M){let B=r.get(y);if(y.isVideoTexture&&O(y),y.isRenderTargetTexture===!1&&y.isExternalTexture!==!0&&y.version>0&&B.__version!==y.version){let z=y.image;if(z===null)qe("WebGLRenderer: Texture marked for update but no image data found.");else if(z.complete===!1)qe("WebGLRenderer: Texture marked for update but image is incomplete");else{Ee(B,y,M);return}}else y.isExternalTexture&&(B.__webglTexture=y.sourceTexture?y.sourceTexture:null);t.bindTexture(e.TEXTURE_2D,B.__webglTexture,e.TEXTURE0+M)}function $(y,M){let B=r.get(y);if(y.isRenderTargetTexture===!1&&y.version>0&&B.__version!==y.version){Ee(B,y,M);return}else y.isExternalTexture&&(B.__webglTexture=y.sourceTexture?y.sourceTexture:null);t.bindTexture(e.TEXTURE_2D_ARRAY,B.__webglTexture,e.TEXTURE0+M)}function j(y,M){let B=r.get(y);if(y.isRenderTargetTexture===!1&&y.version>0&&B.__version!==y.version){Ee(B,y,M);return}t.bindTexture(e.TEXTURE_3D,B.__webglTexture,e.TEXTURE0+M)}function Z(y,M){let B=r.get(y);if(y.isCubeDepthTexture!==!0&&y.version>0&&B.__version!==y.version){Ue(B,y,M);return}t.bindTexture(e.TEXTURE_CUBE_MAP,B.__webglTexture,e.TEXTURE0+M)}let ge={[fn]:e.REPEAT,[Qo]:e.CLAMP_TO_EDGE,[Mf]:e.MIRRORED_REPEAT},_e={[Hn]:e.NEAREST,[Tf]:e.NEAREST_MIPMAP_NEAREST,[fo]:e.NEAREST_MIPMAP_LINEAR,[St]:e.LINEAR,[Jo]:e.LINEAR_MIPMAP_NEAREST,[$t]:e.LINEAR_MIPMAP_LINEAR},ke={[Lf]:e.NEVER,[Of]:e.ALWAYS,[Df]:e.LESS,[si]:e.LEQUAL,[Uf]:e.EQUAL,[li]:e.GEQUAL,[If]:e.GREATER,[Nf]:e.NOTEQUAL};function Xe(y,M){if(M.type===Cn&&n.has("OES_texture_float_linear")===!1&&(M.magFilter===St||M.magFilter===Jo||M.magFilter===fo||M.magFilter===$t||M.minFilter===St||M.minFilter===Jo||M.minFilter===fo||M.minFilter===$t)&&qe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(y,e.TEXTURE_WRAP_S,ge[M.wrapS]),e.texParameteri(y,e.TEXTURE_WRAP_T,ge[M.wrapT]),(y===e.TEXTURE_3D||y===e.TEXTURE_2D_ARRAY)&&e.texParameteri(y,e.TEXTURE_WRAP_R,ge[M.wrapR]),e.texParameteri(y,e.TEXTURE_MAG_FILTER,_e[M.magFilter]),e.texParameteri(y,e.TEXTURE_MIN_FILTER,_e[M.minFilter]),M.compareFunction&&(e.texParameteri(y,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(y,e.TEXTURE_COMPARE_FUNC,ke[M.compareFunction])),n.has("EXT_texture_filter_anisotropic")===!0){if(M.magFilter===Hn||M.minFilter!==fo&&M.minFilter!==$t||M.type===Cn&&n.has("OES_texture_float_linear")===!1)return;if(M.anisotropy>1||r.get(M).__currentAnisotropy){let B=n.get("EXT_texture_filter_anisotropic");e.texParameterf(y,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,o.getMaxAnisotropy())),r.get(M).__currentAnisotropy=M.anisotropy}}}function Ve(y,M){let B=!1;y.__webglInit===void 0&&(y.__webglInit=!0,M.addEventListener("dispose",w));let z=M.source,K=h.get(z);K===void 0&&(K={},h.set(z,K));let re=H(M);if(re!==y.__cacheKey){K[re]===void 0&&(K[re]={texture:e.createTexture(),usedTimes:0},a.memory.textures++,B=!0),K[re].usedTimes++;let oe=K[y.__cacheKey];oe!==void 0&&(K[y.__cacheKey].usedTimes--,oe.usedTimes===0&&C(M)),y.__cacheKey=re,y.__webglTexture=K[re].texture}return B}function Y(y,M,B){return Math.floor(Math.floor(y/B)/M)}function J(y,M,B,z){let re=y.updateRanges;if(re.length===0)t.texSubImage2D(e.TEXTURE_2D,0,0,0,M.width,M.height,B,z,M.data);else{re.sort((be,fe)=>be.start-fe.start);let oe=0;for(let be=1;be<re.length;be++){let fe=re[oe],ae=re[be],we=fe.start+fe.count,Re=Y(ae.start,M.width,4),Le=Y(fe.start,M.width,4);ae.start<=we+1&&Re===Le&&Y(ae.start+ae.count-1,M.width,4)===Re?fe.count=Math.max(fe.count,ae.start+ae.count-fe.start):(++oe,re[oe]=ae)}re.length=oe+1;let q=t.getParameter(e.UNPACK_ROW_LENGTH),ee=t.getParameter(e.UNPACK_SKIP_PIXELS),ie=t.getParameter(e.UNPACK_SKIP_ROWS);t.pixelStorei(e.UNPACK_ROW_LENGTH,M.width);for(let be=0,fe=re.length;be<fe;be++){let ae=re[be],we=Math.floor(ae.start/4),Re=Math.ceil(ae.count/4),Le=we%M.width,N=Math.floor(we/M.width),se=Re,Q=1;t.pixelStorei(e.UNPACK_SKIP_PIXELS,Le),t.pixelStorei(e.UNPACK_SKIP_ROWS,N),t.texSubImage2D(e.TEXTURE_2D,0,Le,N,se,Q,B,z,M.data)}y.clearUpdateRanges(),t.pixelStorei(e.UNPACK_ROW_LENGTH,q),t.pixelStorei(e.UNPACK_SKIP_PIXELS,ee),t.pixelStorei(e.UNPACK_SKIP_ROWS,ie)}}function Ee(y,M,B){let z=e.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(z=e.TEXTURE_2D_ARRAY),M.isData3DTexture&&(z=e.TEXTURE_3D);let K=Ve(y,M),re=M.source;t.bindTexture(z,y.__webglTexture,e.TEXTURE0+B);let oe=r.get(re);if(re.version!==oe.__version||K===!0){if(t.activeTexture(e.TEXTURE0+B),(typeof ImageBitmap<"u"&&M.image instanceof ImageBitmap)===!1){let Q=ct.getPrimaries(ct.workingColorSpace),le=M.colorSpace===un?null:ct.getPrimaries(M.colorSpace),he=M.colorSpace===un||Q===le?e.NONE:e.BROWSER_DEFAULT_WEBGL;t.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,M.flipY),t.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),t.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,he)}t.pixelStorei(e.UNPACK_ALIGNMENT,M.unpackAlignment);let ee=p(M.image,!1,o.maxTextureSize);ee=Ut(M,ee);let ie=i.convert(M.format,M.colorSpace),be=i.convert(M.type),fe=g(M.internalFormat,ie,be,M.normalized,M.colorSpace,M.isVideoTexture);Xe(z,M);let ae,we=M.mipmaps,Re=M.isVideoTexture!==!0,Le=oe.__version===void 0||K===!0,N=re.dataReady,se=b(M,ee);if(M.isDepthTexture)fe=E(M.format===tr,M.type),Le&&(Re?t.texStorage2D(e.TEXTURE_2D,1,fe,ee.width,ee.height):t.texImage2D(e.TEXTURE_2D,0,fe,ee.width,ee.height,0,ie,be,null));else if(M.isDataTexture)if(we.length>0){Re&&Le&&t.texStorage2D(e.TEXTURE_2D,se,fe,we[0].width,we[0].height);for(let Q=0,le=we.length;Q<le;Q++)ae=we[Q],Re?N&&t.texSubImage2D(e.TEXTURE_2D,Q,0,0,ae.width,ae.height,ie,be,ae.data):t.texImage2D(e.TEXTURE_2D,Q,fe,ae.width,ae.height,0,ie,be,ae.data);M.generateMipmaps=!1}else Re?(Le&&t.texStorage2D(e.TEXTURE_2D,se,fe,ee.width,ee.height),N&&J(M,ee,ie,be)):t.texImage2D(e.TEXTURE_2D,0,fe,ee.width,ee.height,0,ie,be,ee.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){Re&&Le&&t.texStorage3D(e.TEXTURE_2D_ARRAY,se,fe,we[0].width,we[0].height,ee.depth);for(let Q=0,le=we.length;Q<le;Q++)if(ae=we[Q],M.format!==Jt)if(ie!==null)if(Re){if(N)if(M.layerUpdates.size>0){let he=bs(ae.width,ae.height,M.format,M.type);for(let ne of M.layerUpdates){let Ae=ae.data.subarray(ne*he/ae.data.BYTES_PER_ELEMENT,(ne+1)*he/ae.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Q,0,0,ne,ae.width,ae.height,1,ie,Ae)}}else t.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Q,0,0,0,ae.width,ae.height,ee.depth,ie,ae.data)}else t.compressedTexImage3D(e.TEXTURE_2D_ARRAY,Q,fe,ae.width,ae.height,ee.depth,0,ae.data,0,0);else qe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Re?N&&t.texSubImage3D(e.TEXTURE_2D_ARRAY,Q,0,0,0,ae.width,ae.height,ee.depth,ie,be,ae.data):t.texImage3D(e.TEXTURE_2D_ARRAY,Q,fe,ae.width,ae.height,ee.depth,0,ie,be,ae.data);M.layerUpdates.size>0&&M.clearLayerUpdates()}else{Re&&Le&&t.texStorage2D(e.TEXTURE_2D,se,fe,we[0].width,we[0].height);for(let Q=0,le=we.length;Q<le;Q++)ae=we[Q],M.format!==Jt?ie!==null?Re?N&&t.compressedTexSubImage2D(e.TEXTURE_2D,Q,0,0,ae.width,ae.height,ie,ae.data):t.compressedTexImage2D(e.TEXTURE_2D,Q,fe,ae.width,ae.height,0,ae.data):qe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Re?N&&t.texSubImage2D(e.TEXTURE_2D,Q,0,0,ae.width,ae.height,ie,be,ae.data):t.texImage2D(e.TEXTURE_2D,Q,fe,ae.width,ae.height,0,ie,be,ae.data)}else if(M.isDataArrayTexture)if(Re){if(Le&&t.texStorage3D(e.TEXTURE_2D_ARRAY,se,fe,ee.width,ee.height,ee.depth),N)if(M.layerUpdates.size>0){let Q=bs(ee.width,ee.height,M.format,M.type);for(let le of M.layerUpdates){let he=ee.data.subarray(le*Q/ee.data.BYTES_PER_ELEMENT,(le+1)*Q/ee.data.BYTES_PER_ELEMENT);t.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,le,ee.width,ee.height,1,ie,be,he)}M.clearLayerUpdates()}else t.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,ee.width,ee.height,ee.depth,ie,be,ee.data)}else t.texImage3D(e.TEXTURE_2D_ARRAY,0,fe,ee.width,ee.height,ee.depth,0,ie,be,ee.data);else if(M.isData3DTexture)Re?(Le&&t.texStorage3D(e.TEXTURE_3D,se,fe,ee.width,ee.height,ee.depth),N&&t.texSubImage3D(e.TEXTURE_3D,0,0,0,0,ee.width,ee.height,ee.depth,ie,be,ee.data)):t.texImage3D(e.TEXTURE_3D,0,fe,ee.width,ee.height,ee.depth,0,ie,be,ee.data);else if(M.isFramebufferTexture){if(Le)if(Re)t.texStorage2D(e.TEXTURE_2D,se,fe,ee.width,ee.height);else{let Q=ee.width,le=ee.height;for(let he=0;he<se;he++)t.texImage2D(e.TEXTURE_2D,he,fe,Q,le,0,ie,be,null),Q>>=1,le>>=1}}else if(M.isHTMLTexture){if("texElementImage2D"in e){let Q=e.canvas;if(Q.hasAttribute("layoutsubtree")||Q.setAttribute("layoutsubtree","true"),ee.parentNode!==Q){Q.appendChild(ee),u.add(M),Q.onpaint=le=>{let he=le.changedElements;for(let ne of u)he.includes(ne.image)&&(ne.needsUpdate=!0)},Q.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,ee);else{let he=e.RGBA,ne=e.RGBA,Ae=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,he,ne,Ae,ee)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(we.length>0){if(Re&&Le){let Q=Ze(we[0]);t.texStorage2D(e.TEXTURE_2D,se,fe,Q.width,Q.height)}for(let Q=0,le=we.length;Q<le;Q++)ae=we[Q],Re?N&&t.texSubImage2D(e.TEXTURE_2D,Q,0,0,ie,be,ae):t.texImage2D(e.TEXTURE_2D,Q,fe,ie,be,ae);M.generateMipmaps=!1}else if(Re){if(Le){let Q=Ze(ee);t.texStorage2D(e.TEXTURE_2D,se,fe,Q.width,Q.height)}N&&t.texSubImage2D(e.TEXTURE_2D,0,0,0,ie,be,ee)}else t.texImage2D(e.TEXTURE_2D,0,fe,ie,be,ee);m(M)&&v(z),oe.__version=re.version,M.onUpdate&&M.onUpdate(M)}y.__version=M.version}function Ue(y,M,B){if(M.image.length!==6)return;let z=Ve(y,M),K=M.source;t.bindTexture(e.TEXTURE_CUBE_MAP,y.__webglTexture,e.TEXTURE0+B);let re=r.get(K);if(K.version!==re.__version||z===!0){t.activeTexture(e.TEXTURE0+B);let oe=ct.getPrimaries(ct.workingColorSpace),q=M.colorSpace===un?null:ct.getPrimaries(M.colorSpace),ee=M.colorSpace===un||oe===q?e.NONE:e.BROWSER_DEFAULT_WEBGL;t.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,M.flipY),t.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),t.pixelStorei(e.UNPACK_ALIGNMENT,M.unpackAlignment),t.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,ee);let ie=M.isCompressedTexture||M.image[0].isCompressedTexture,be=M.image[0]&&M.image[0].isDataTexture,fe=[];for(let ne=0;ne<6;ne++)!ie&&!be?fe[ne]=p(M.image[ne],!0,o.maxCubemapSize):fe[ne]=be?M.image[ne].image:M.image[ne],fe[ne]=Ut(M,fe[ne]);let ae=fe[0],we=i.convert(M.format,M.colorSpace),Re=i.convert(M.type),Le=g(M.internalFormat,we,Re,M.normalized,M.colorSpace),N=M.isVideoTexture!==!0,se=re.__version===void 0||z===!0,Q=K.dataReady,le=b(M,ae);Xe(e.TEXTURE_CUBE_MAP,M);let he;if(ie){N&&se&&t.texStorage2D(e.TEXTURE_CUBE_MAP,le,Le,ae.width,ae.height);for(let ne=0;ne<6;ne++){he=fe[ne].mipmaps;for(let Ae=0;Ae<he.length;Ae++){let Me=he[Ae];M.format!==Jt?we!==null?N?Q&&t.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae,0,0,Me.width,Me.height,we,Me.data):t.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae,Le,Me.width,Me.height,0,Me.data):qe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):N?Q&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae,0,0,Me.width,Me.height,we,Re,Me.data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae,Le,Me.width,Me.height,0,we,Re,Me.data)}}}else{if(he=M.mipmaps,N&&se){he.length>0&&le++;let ne=Ze(fe[0]);t.texStorage2D(e.TEXTURE_CUBE_MAP,le,Le,ne.width,ne.height)}for(let ne=0;ne<6;ne++)if(be){N?Q&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,fe[ne].width,fe[ne].height,we,Re,fe[ne].data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,Le,fe[ne].width,fe[ne].height,0,we,Re,fe[ne].data);for(let Ae=0;Ae<he.length;Ae++){let rt=he[Ae].image[ne].image;N?Q&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae+1,0,0,rt.width,rt.height,we,Re,rt.data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae+1,Le,rt.width,rt.height,0,we,Re,rt.data)}}else{N?Q&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,we,Re,fe[ne]):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,Le,we,Re,fe[ne]);for(let Ae=0;Ae<he.length;Ae++){let Me=he[Ae];N?Q&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae+1,0,0,we,Re,Me.image[ne]):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae+1,Le,we,Re,Me.image[ne])}}}m(M)&&v(e.TEXTURE_CUBE_MAP),re.__version=K.version,M.onUpdate&&M.onUpdate(M)}y.__version=M.version}function ve(y,M,B,z,K,re){let oe=i.convert(B.format,B.colorSpace),q=i.convert(B.type),ee=g(B.internalFormat,oe,q,B.normalized,B.colorSpace),ie=r.get(M),be=r.get(B);if(be.__renderTarget=M,!ie.__hasExternalTextures){let fe=Math.max(1,M.width>>re),ae=Math.max(1,M.height>>re);K===e.TEXTURE_3D||K===e.TEXTURE_2D_ARRAY?t.texImage3D(K,re,ee,fe,ae,M.depth,0,oe,q,null):t.texImage2D(K,re,ee,fe,ae,0,oe,q,null)}t.bindFramebuffer(e.FRAMEBUFFER,y),_t(M)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,z,K,be.__webglTexture,0,ut(M)):(K===e.TEXTURE_2D||K>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&K<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,z,K,be.__webglTexture,re),t.bindFramebuffer(e.FRAMEBUFFER,null)}function ze(y,M,B){if(e.bindRenderbuffer(e.RENDERBUFFER,y),M.depthBuffer){let z=M.depthTexture,K=z&&z.isDepthTexture?z.type:null,re=E(M.stencilBuffer,K),oe=M.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;_t(M)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,ut(M),re,M.width,M.height):B?e.renderbufferStorageMultisample(e.RENDERBUFFER,ut(M),re,M.width,M.height):e.renderbufferStorage(e.RENDERBUFFER,re,M.width,M.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,oe,e.RENDERBUFFER,y)}else{let z=M.textures;for(let K=0;K<z.length;K++){let re=z[K],oe=i.convert(re.format,re.colorSpace),q=i.convert(re.type),ee=g(re.internalFormat,oe,q,re.normalized,re.colorSpace);_t(M)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,ut(M),ee,M.width,M.height):B?e.renderbufferStorageMultisample(e.RENDERBUFFER,ut(M),ee,M.width,M.height):e.renderbufferStorage(e.RENDERBUFFER,ee,M.width,M.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Mt(y,M,B){let z=M.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(e.FRAMEBUFFER,y),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let K=r.get(M.depthTexture);if(K.__renderTarget=M,(!K.__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),z){if(K.__webglInit===void 0&&(K.__webglInit=!0,M.depthTexture.addEventListener("dispose",w)),K.__webglTexture===void 0){K.__webglTexture=e.createTexture(),t.bindTexture(e.TEXTURE_CUBE_MAP,K.__webglTexture),Xe(e.TEXTURE_CUBE_MAP,M.depthTexture);let ie=i.convert(M.depthTexture.format),be=i.convert(M.depthTexture.type),fe;M.depthTexture.format===er?fe=e.DEPTH_COMPONENT24:M.depthTexture.format===tr&&(fe=e.DEPTH24_STENCIL8);for(let ae=0;ae<6;ae++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,fe,M.width,M.height,0,ie,be,null)}}else X(M.depthTexture,0);let re=K.__webglTexture,oe=ut(M),q=z?e.TEXTURE_CUBE_MAP_POSITIVE_X+B:e.TEXTURE_2D,ee=M.depthTexture.format===tr?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(M.depthTexture.format===er)_t(M)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,ee,q,re,0,oe):e.framebufferTexture2D(e.FRAMEBUFFER,ee,q,re,0);else if(M.depthTexture.format===tr)_t(M)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,ee,q,re,0,oe):e.framebufferTexture2D(e.FRAMEBUFFER,ee,q,re,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Oe(y){let M=r.get(y),B=y.isWebGLCubeRenderTarget===!0;if(M.__boundDepthTexture!==y.depthTexture){let z=y.depthTexture;if(M.__depthDisposeCallback&&M.__depthDisposeCallback(),z){let K=()=>{delete M.__boundDepthTexture,delete M.__depthDisposeCallback,z.removeEventListener("dispose",K)};z.addEventListener("dispose",K),M.__depthDisposeCallback=K}M.__boundDepthTexture=z}if(y.depthTexture&&!M.__autoAllocateDepthBuffer)if(B)for(let z=0;z<6;z++)Mt(M.__webglFramebuffer[z],y,z);else{let z=y.texture.mipmaps;z&&z.length>0?Mt(M.__webglFramebuffer[0],y,0):Mt(M.__webglFramebuffer,y,0)}else if(B){M.__webglDepthbuffer=[];for(let z=0;z<6;z++)if(t.bindFramebuffer(e.FRAMEBUFFER,M.__webglFramebuffer[z]),M.__webglDepthbuffer[z]===void 0)M.__webglDepthbuffer[z]=e.createRenderbuffer(),ze(M.__webglDepthbuffer[z],y,!1);else{let K=y.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,re=M.__webglDepthbuffer[z];e.bindRenderbuffer(e.RENDERBUFFER,re),e.framebufferRenderbuffer(e.FRAMEBUFFER,K,e.RENDERBUFFER,re)}}else{let z=y.texture.mipmaps;if(z&&z.length>0?t.bindFramebuffer(e.FRAMEBUFFER,M.__webglFramebuffer[0]):t.bindFramebuffer(e.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer===void 0)M.__webglDepthbuffer=e.createRenderbuffer(),ze(M.__webglDepthbuffer,y,!1);else{let K=y.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,re=M.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,re),e.framebufferRenderbuffer(e.FRAMEBUFFER,K,e.RENDERBUFFER,re)}}t.bindFramebuffer(e.FRAMEBUFFER,null)}function $e(y,M,B){let z=r.get(y);M!==void 0&&ve(z.__webglFramebuffer,y,y.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),B!==void 0&&Oe(y)}function nt(y){let M=y.texture,B=r.get(y),z=r.get(M);y.addEventListener("dispose",S);let K=y.textures,re=y.isWebGLCubeRenderTarget===!0,oe=K.length>1;if(oe||(z.__webglTexture===void 0&&(z.__webglTexture=e.createTexture()),z.__version=M.version,a.memory.textures++),re){B.__webglFramebuffer=[];for(let q=0;q<6;q++)if(M.mipmaps&&M.mipmaps.length>0){B.__webglFramebuffer[q]=[];for(let ee=0;ee<M.mipmaps.length;ee++)B.__webglFramebuffer[q][ee]=e.createFramebuffer()}else B.__webglFramebuffer[q]=e.createFramebuffer()}else{if(M.mipmaps&&M.mipmaps.length>0){B.__webglFramebuffer=[];for(let q=0;q<M.mipmaps.length;q++)B.__webglFramebuffer[q]=e.createFramebuffer()}else B.__webglFramebuffer=e.createFramebuffer();if(oe)for(let q=0,ee=K.length;q<ee;q++){let ie=r.get(K[q]);ie.__webglTexture===void 0&&(ie.__webglTexture=e.createTexture(),a.memory.textures++)}if(y.samples>0&&_t(y)===!1){B.__webglMultisampledFramebuffer=e.createFramebuffer(),B.__webglColorRenderbuffer=[],t.bindFramebuffer(e.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let q=0;q<K.length;q++){let ee=K[q];B.__webglColorRenderbuffer[q]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,B.__webglColorRenderbuffer[q]);let ie=i.convert(ee.format,ee.colorSpace),be=i.convert(ee.type),fe=g(ee.internalFormat,ie,be,ee.normalized,ee.colorSpace,y.isXRRenderTarget===!0),ae=ut(y);e.renderbufferStorageMultisample(e.RENDERBUFFER,ae,fe,y.width,y.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+q,e.RENDERBUFFER,B.__webglColorRenderbuffer[q])}e.bindRenderbuffer(e.RENDERBUFFER,null),y.depthBuffer&&(B.__webglDepthRenderbuffer=e.createRenderbuffer(),ze(B.__webglDepthRenderbuffer,y,!0)),t.bindFramebuffer(e.FRAMEBUFFER,null)}}if(re){t.bindTexture(e.TEXTURE_CUBE_MAP,z.__webglTexture),Xe(e.TEXTURE_CUBE_MAP,M);for(let q=0;q<6;q++)if(M.mipmaps&&M.mipmaps.length>0)for(let ee=0;ee<M.mipmaps.length;ee++)ve(B.__webglFramebuffer[q][ee],y,M,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+q,ee);else ve(B.__webglFramebuffer[q],y,M,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+q,0);m(M)&&v(e.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(oe){for(let q=0,ee=K.length;q<ee;q++){let ie=K[q],be=r.get(ie),fe=e.TEXTURE_2D;(y.isWebGL3DRenderTarget||y.isWebGLArrayRenderTarget)&&(fe=y.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),t.bindTexture(fe,be.__webglTexture),Xe(fe,ie),ve(B.__webglFramebuffer,y,ie,e.COLOR_ATTACHMENT0+q,fe,0),m(ie)&&v(fe)}t.unbindTexture()}else{let q=e.TEXTURE_2D;if((y.isWebGL3DRenderTarget||y.isWebGLArrayRenderTarget)&&(q=y.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),t.bindTexture(q,z.__webglTexture),Xe(q,M),M.mipmaps&&M.mipmaps.length>0)for(let ee=0;ee<M.mipmaps.length;ee++)ve(B.__webglFramebuffer[ee],y,M,e.COLOR_ATTACHMENT0,q,ee);else ve(B.__webglFramebuffer,y,M,e.COLOR_ATTACHMENT0,q,0);m(M)&&v(q),t.unbindTexture()}y.depthBuffer&&Oe(y)}function He(y){let M=y.textures;for(let B=0,z=M.length;B<z;B++){let K=M[B];if(m(K)){let re=x(y),oe=r.get(K).__webglTexture;t.bindTexture(re,oe),v(re),t.unbindTexture()}}}let lt=[],Rt=[];function Bt(y){if(y.samples>0){if(_t(y)===!1){let M=y.textures,B=y.width,z=y.height,K=e.COLOR_BUFFER_BIT,re=y.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,oe=r.get(y),q=M.length>1;if(q)for(let ie=0;ie<M.length;ie++)t.bindFramebuffer(e.FRAMEBUFFER,oe.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ie,e.RENDERBUFFER,null),t.bindFramebuffer(e.FRAMEBUFFER,oe.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ie,e.TEXTURE_2D,null,0);t.bindFramebuffer(e.READ_FRAMEBUFFER,oe.__webglMultisampledFramebuffer);let ee=y.texture.mipmaps;ee&&ee.length>0?t.bindFramebuffer(e.DRAW_FRAMEBUFFER,oe.__webglFramebuffer[0]):t.bindFramebuffer(e.DRAW_FRAMEBUFFER,oe.__webglFramebuffer);for(let ie=0;ie<M.length;ie++){if(y.resolveDepthBuffer&&(y.depthBuffer&&(K|=e.DEPTH_BUFFER_BIT),y.stencilBuffer&&y.resolveStencilBuffer&&(K|=e.STENCIL_BUFFER_BIT)),q){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,oe.__webglColorRenderbuffer[ie]);let be=r.get(M[ie]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,be,0)}e.blitFramebuffer(0,0,B,z,0,0,B,z,K,e.NEAREST),l===!0&&(lt.length=0,Rt.length=0,lt.push(e.COLOR_ATTACHMENT0+ie),y.depthBuffer&&y.storeMultisampledDepthBuffer===!1&&(lt.push(re),Rt.push(re),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,Rt)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,lt))}if(t.bindFramebuffer(e.READ_FRAMEBUFFER,null),t.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),q)for(let ie=0;ie<M.length;ie++){t.bindFramebuffer(e.FRAMEBUFFER,oe.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ie,e.RENDERBUFFER,oe.__webglColorRenderbuffer[ie]);let be=r.get(M[ie]).__webglTexture;t.bindFramebuffer(e.FRAMEBUFFER,oe.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ie,e.TEXTURE_2D,be,0)}t.bindFramebuffer(e.DRAW_FRAMEBUFFER,oe.__webglMultisampledFramebuffer)}else if(y.depthBuffer&&y.storeMultisampledDepthBuffer===!1&&l){let M=y.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[M])}}}function ut(y){return Math.min(o.maxSamples,y.samples)}function _t(y){let M=r.get(y);return y.samples>0&&n.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function O(y){let M=a.render.frame;f.get(y)!==M&&(f.set(y,M),y.update())}function Ut(y,M){let B=y.colorSpace,z=y.format,K=y.type;return y.isCompressedTexture===!0||y.isVideoTexture===!0||B!==ss&&B!==un&&(ct.getTransfer(B)===tt?(z!==Jt||K!==Kt)&&qe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):it("WebGLTextures: Unsupported texture color space:",B)),M}function Ze(y){return typeof HTMLImageElement<"u"&&y instanceof HTMLImageElement?(c.width=y.naturalWidth||y.width,c.height=y.naturalHeight||y.height):typeof VideoFrame<"u"&&y instanceof VideoFrame?(c.width=y.displayWidth,c.height=y.displayHeight):(c.width=y.width,c.height=y.height),c}this.allocateTextureUnit=G,this.resetTextureUnits=U,this.getTextureUnits=L,this.setTextureUnits=F,this.setTexture2D=X,this.setTexture2DArray=$,this.setTexture3D=j,this.setTextureCube=Z,this.rebindTextures=$e,this.setupRenderTarget=nt,this.updateRenderTargetMipmap=He,this.updateMultisampleRenderTarget=Bt,this.setupDepthRenderbuffer=Oe,this.setupFrameBufferTexture=ve,this.useMultisampledRTT=_t,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function Vv(e,n){function t(r,o=un){let i,a=ct.getTransfer(o);if(r===Kt)return e.UNSIGNED_BYTE;if(r===wa)return e.UNSIGNED_SHORT_4_4_4_4;if(r===Aa)return e.UNSIGNED_SHORT_5_5_5_1;if(r===Af)return e.UNSIGNED_INT_5_9_9_9_REV;if(r===Rf)return e.UNSIGNED_INT_10F_11F_11F_REV;if(r===bf)return e.BYTE;if(r===wf)return e.SHORT;if(r===uo)return e.UNSIGNED_SHORT;if(r===ba)return e.INT;if(r===Bn)return e.UNSIGNED_INT;if(r===Cn)return e.FLOAT;if(r===xn)return e.HALF_FLOAT;if(r===yf)return e.ALPHA;if(r===Cf)return e.RGB;if(r===Jt)return e.RGBA;if(r===er)return e.DEPTH_COMPONENT;if(r===tr)return e.DEPTH_STENCIL;if(r===ei)return e.RED;if(r===Ra)return e.RED_INTEGER;if(r===nr)return e.RG;if(r===ya)return e.RG_INTEGER;if(r===Ca)return e.RGBA_INTEGER;if(r===ti||r===ni||r===ri||r===oi)if(a===tt)if(i=n.get("WEBGL_compressed_texture_s3tc_srgb"),i!==null){if(r===ti)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===ni)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===ri)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===oi)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(i=n.get("WEBGL_compressed_texture_s3tc"),i!==null){if(r===ti)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===ni)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===ri)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===oi)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===Pa||r===La||r===Da||r===Ua)if(i=n.get("WEBGL_compressed_texture_pvrtc"),i!==null){if(r===Pa)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===La)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===Da)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===Ua)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===Ia||r===Na||r===Oa||r===Fa||r===Ha||r===ii||r===Ba)if(i=n.get("WEBGL_compressed_texture_etc"),i!==null){if(r===Ia||r===Na)return a===tt?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(r===Oa)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(r===Fa)return i.COMPRESSED_R11_EAC;if(r===Ha)return i.COMPRESSED_SIGNED_R11_EAC;if(r===ii)return i.COMPRESSED_RG11_EAC;if(r===Ba)return i.COMPRESSED_SIGNED_RG11_EAC}else return null;if(r===Ga||r===ka||r===Va||r===za||r===Wa||r===Xa||r===$a||r===Ka||r===Ya||r===qa||r===Za||r===ja||r===Qa||r===Ja)if(i=n.get("WEBGL_compressed_texture_astc"),i!==null){if(r===Ga)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===ka)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===Va)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===za)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===Wa)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===Xa)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===$a)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===Ka)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===Ya)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===qa)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===Za)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===ja)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===Qa)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===Ja)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===es||r===ts||r===ns)if(i=n.get("EXT_texture_compression_bptc"),i!==null){if(r===es)return a===tt?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(r===ts)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(r===ns)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(r===rs||r===os||r===ai||r===is)if(i=n.get("EXT_texture_compression_rgtc"),i!==null){if(r===rs)return i.COMPRESSED_RED_RGTC1_EXT;if(r===os)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(r===ai)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(r===is)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return r===Lr?e.UNSIGNED_INT_24_8:e[r]!==void 0?e[r]:null}return{convert:t}}var zv=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Wv=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Vs=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(n,t){if(this.texture===null){let r=new vs(n.texture);(n.depthNear!==t.depthNear||n.depthFar!==t.depthFar)&&(this.depthNear=n.depthNear,this.depthFar=n.depthFar),this.texture=r}}getMesh(n){if(this.texture!==null&&this.mesh===null){let t=n.cameras[0].viewport,r=new tn({vertexShader:zv,fragmentShader:Wv,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new yt(new Ct(20,20),r)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},zs=class extends Vf{constructor(n,t){super();let r=this,o=null,i=1,a=null,s="local-floor",l=1,c=null,f=null,u=null,d=null,h=null,_=null,T=typeof XRWebGLBinding<"u",p=new Vs,m={},v=t.getContextAttributes(),x=null,g=null,E=[],b=[],w=new je,S=null,A=null,C=new mo;C.viewport=new Lt;let P=new mo;P.viewport=new Lt;let D=[C,P],U=new ru,L=null,F=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Y){let J=E[Y];return J===void 0&&(J=new ci,E[Y]=J),J.getTargetRaySpace()},this.getControllerGrip=function(Y){let J=E[Y];return J===void 0&&(J=new ci,E[Y]=J),J.getGripSpace()},this.getHand=function(Y){let J=E[Y];return J===void 0&&(J=new ci,E[Y]=J),J.getHandSpace()};function G(Y){let J=b.indexOf(Y.inputSource);if(J===-1)return;let Ee=E[J];Ee!==void 0&&(Ee.update(Y.inputSource,Y.frame,c||a),Ee.dispatchEvent({type:Y.type,data:Y.inputSource}))}function H(){o.removeEventListener("select",G),o.removeEventListener("selectstart",G),o.removeEventListener("selectend",G),o.removeEventListener("squeeze",G),o.removeEventListener("squeezestart",G),o.removeEventListener("squeezeend",G),o.removeEventListener("end",H),o.removeEventListener("inputsourceschange",X);for(let Y=0;Y<E.length;Y++){let J=b[Y];J!==null&&(b[Y]=null,E[Y].disconnect(J))}L=null,F=null,p.reset();for(let Y in m)delete m[Y];if(n.setRenderTarget(x),h=null,d=null,u=null,o=null,g=null,Ve.stop(),r.isPresenting=!1,n.setPixelRatio(S),n.setSize(w.width,w.height,!1),A!==null){let Y=A.camera;Y.fov=A.fov,Y.zoom=A.zoom,Y.updateProjectionMatrix(),A=null}r.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Y){i=Y,r.isPresenting===!0&&qe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){s=Y,r.isPresenting===!0&&qe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(Y){c=Y},this.getBaseLayer=function(){return d!==null?d:h},this.getBinding=function(){return u===null&&T&&(u=new XRWebGLBinding(o,t)),u},this.getFrame=function(){return _},this.getSession=function(){return o},this.setSession=async function(Y){if(o=Y,o!==null){if(x=n.getRenderTarget(),o.addEventListener("select",G),o.addEventListener("selectstart",G),o.addEventListener("selectend",G),o.addEventListener("squeeze",G),o.addEventListener("squeezestart",G),o.addEventListener("squeezeend",G),o.addEventListener("end",H),o.addEventListener("inputsourceschange",X),v.xrCompatible!==!0&&await t.makeXRCompatible(),S=n.getPixelRatio(),n.getSize(w),T&&"createProjectionLayer"in XRWebGLBinding.prototype){let Ee=null,Ue=null,ve=null;v.depth&&(ve=v.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Ee=v.stencil?tr:er,Ue=v.stencil?Lr:Bn);let ze={colorFormat:t.RGBA8,depthFormat:ve,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(ze),o.updateRenderState({layers:[d]}),n.setPixelRatio(1),n.setSize(d.textureWidth,d.textureHeight,!1),g=new en(d.textureWidth,d.textureHeight,{format:Jt,type:Kt,depthTexture:new po(d.textureWidth,d.textureHeight,Ue,void 0,void 0,void 0,void 0,void 0,void 0,Ee),stencilBuffer:v.stencil,colorSpace:n.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let Ee={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:i};h=new XRWebGLLayer(o,t,Ee),o.updateRenderState({baseLayer:h}),n.setPixelRatio(1),n.setSize(h.framebufferWidth,h.framebufferHeight,!1),g=new en(h.framebufferWidth,h.framebufferHeight,{format:Jt,type:Kt,colorSpace:n.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}g.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await o.requestReferenceSpace(s),Ve.setContext(o),Ve.start(),r.isPresenting=!0,r.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(o!==null)return o.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function X(Y){for(let J=0;J<Y.removed.length;J++){let Ee=Y.removed[J],Ue=b.indexOf(Ee);Ue>=0&&(b[Ue]=null,E[Ue].disconnect(Ee))}for(let J=0;J<Y.added.length;J++){let Ee=Y.added[J],Ue=b.indexOf(Ee);if(Ue===-1){for(let ze=0;ze<E.length;ze++)if(ze>=b.length){b.push(Ee),Ue=ze;break}else if(b[ze]===null){b[ze]=Ee,Ue=ze;break}if(Ue===-1)break}let ve=E[Ue];ve&&ve.connect(Ee)}}let $=new te,j=new te;function Z(Y,J,Ee){$.setFromMatrixPosition(J.matrixWorld),j.setFromMatrixPosition(Ee.matrixWorld);let Ue=$.distanceTo(j),ve=J.projectionMatrix.elements,ze=Ee.projectionMatrix.elements,Mt=ve[14]/(ve[10]-1),Oe=ve[14]/(ve[10]+1),$e=(ve[9]+1)/ve[5],nt=(ve[9]-1)/ve[5],He=(ve[8]-1)/ve[0],lt=(ze[8]+1)/ze[0],Rt=Mt*He,Bt=Mt*lt,ut=Ue/(-He+lt),_t=ut*-He;if(J.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(_t),Y.translateZ(ut),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert(),ve[10]===-1)Y.projectionMatrix.copy(J.projectionMatrix),Y.projectionMatrixInverse.copy(J.projectionMatrixInverse);else{let O=Mt+ut,Ut=Oe+ut,Ze=Rt-_t,y=Bt+(Ue-_t),M=$e*Oe/Ut*O,B=nt*Oe/Ut*O;Y.projectionMatrix.makePerspective(Ze,y,M,B,O,Ut),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert()}}function ge(Y,J){J===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(J.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}this.updateCamera=function(Y){if(o===null)return;let J=Y.near,Ee=Y.far;p.texture!==null&&(p.depthNear>0&&(J=p.depthNear),p.depthFar>0&&(Ee=p.depthFar)),U.near=P.near=C.near=J,U.far=P.far=C.far=Ee,(L!==U.near||F!==U.far)&&(o.updateRenderState({depthNear:U.near,depthFar:U.far}),L=U.near,F=U.far),U.layers.mask=Y.layers.mask|6,C.layers.mask=U.layers.mask&-5,P.layers.mask=U.layers.mask&-3;let Ue=Y.parent,ve=U.cameras;ge(U,Ue);for(let ze=0;ze<ve.length;ze++)ge(ve[ze],Ue);ve.length===2?Z(U,C,P):U.projectionMatrix.copy(C.projectionMatrix),A===null&&Y.isPerspectiveCamera&&(A={camera:Y,fov:Y.fov,zoom:Y.zoom}),_e(Y,U,Ue)};function _e(Y,J,Ee){Ee===null?Y.matrix.copy(J.matrixWorld):(Y.matrix.copy(Ee.matrixWorld),Y.matrix.invert(),Y.matrix.multiply(J.matrixWorld)),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.updateMatrixWorld(!0),Y.projectionMatrix.copy(J.projectionMatrix),Y.projectionMatrixInverse.copy(J.projectionMatrixInverse),Y.isPerspectiveCamera&&(Y.fov=zf*2*Math.atan(1/Y.projectionMatrix.elements[5]),Y.zoom=1)}this.getCamera=function(){return U},this.getFoveation=function(){if(!(d===null&&h===null))return l},this.setFoveation=function(Y){l=Y,d!==null&&(d.fixedFoveation=Y),h!==null&&h.fixedFoveation!==void 0&&(h.fixedFoveation=Y)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(U)},this.getCameraTexture=function(Y){return m[Y]};let ke=null;function Xe(Y,J){if(f=J.getViewerPose(c||a),_=J,f!==null){let Ee=f.views;h!==null&&(n.setRenderTargetFramebuffer(g,h.framebuffer),n.setRenderTarget(g));let Ue=!1;Ee.length!==U.cameras.length&&(U.cameras.length=0,Ue=!0);for(let Oe=0;Oe<Ee.length;Oe++){let $e=Ee[Oe],nt=null;if(h!==null)nt=h.getViewport($e);else{let lt=u.getViewSubImage(d,$e);nt=lt.viewport,Oe===0&&(n.setRenderTargetTextures(g,lt.colorTexture,lt.depthStencilTexture),n.setRenderTarget(g))}let He=D[Oe];He===void 0&&(He=new mo,He.layers.enable(Oe),He.viewport=new Lt,D[Oe]=He),He.matrix.fromArray($e.transform.matrix),He.matrix.decompose(He.position,He.quaternion,He.scale),He.projectionMatrix.fromArray($e.projectionMatrix),He.projectionMatrixInverse.copy(He.projectionMatrix).invert(),He.viewport.set(nt.x,nt.y,nt.width,nt.height),Oe===0&&(U.matrix.copy(He.matrix),U.matrix.decompose(U.position,U.quaternion,U.scale)),Ue===!0&&U.cameras.push(He)}let ve=o.enabledFeatures;if(ve&&ve.includes("depth-sensing")&&o.depthUsage=="gpu-optimized"&&T){u=r.getBinding();let Oe=u.getDepthInformation(Ee[0]);Oe&&Oe.isValid&&Oe.texture&&p.init(Oe,o.renderState)}if(ve&&ve.includes("camera-access")&&T){n.state.unbindTexture(),u=r.getBinding();for(let Oe=0;Oe<Ee.length;Oe++){let $e=Ee[Oe].camera;if($e){let nt=m[$e];nt||(nt=new vs,m[$e]=nt);let He=u.getCameraImage($e);nt.sourceTexture=He}}}}for(let Ee=0;Ee<E.length;Ee++){let Ue=b[Ee],ve=E[Ee];Ue!==null&&ve!==void 0&&ve.update(Ue,J,c||a)}ke&&ke(Y,J),J.detectedPlanes&&r.dispatchEvent({type:"planesdetected",data:J}),_=null}let Ve=new Iu;Ve.setAnimationLoop(Xe),this.setAnimationLoop=function(Y){ke=Y},this.dispose=function(){}}},Xv=new qt,Gu=new Be;Gu.set(-1,0,0,0,1,0,0,0,1);function $v(e,n){function t(p,m){p.matrixAutoUpdate===!0&&p.updateMatrix(),m.value.copy(p.matrix)}function r(p,m){m.color.getRGB(p.fogColor.value,xs(e)),m.isFog?(p.fogNear.value=m.near,p.fogFar.value=m.far):m.isFogExp2&&(p.fogDensity.value=m.density)}function o(p,m,v,x,g){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?i(p,m):m.isMeshLambertMaterial?(i(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(i(p,m),u(p,m)):m.isMeshPhongMaterial?(i(p,m),f(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(i(p,m),d(p,m),m.isMeshPhysicalMaterial&&h(p,m,g)):m.isMeshMatcapMaterial?(i(p,m),_(p,m)):m.isMeshDepthMaterial?i(p,m):m.isMeshDistanceMaterial?(i(p,m),T(p,m)):m.isMeshNormalMaterial?i(p,m):m.isLineBasicMaterial?(a(p,m),m.isLineDashedMaterial&&s(p,m)):m.isPointsMaterial?l(p,m,v,x):m.isSpriteMaterial?c(p,m):m.isShadowMaterial?(p.color.value.copy(m.color),p.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function i(p,m){p.opacity.value=m.opacity,m.color&&p.diffuse.value.copy(m.color),m.emissive&&p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.bumpMap&&(p.bumpMap.value=m.bumpMap,t(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===kt&&(p.bumpScale.value*=-1)),m.normalMap&&(p.normalMap.value=m.normalMap,t(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===kt&&p.normalScale.value.negate()),m.displacementMap&&(p.displacementMap.value=m.displacementMap,t(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias),m.emissiveMap&&(p.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,p.emissiveMapTransform)),m.specularMap&&(p.specularMap.value=m.specularMap,t(m.specularMap,p.specularMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest);let v=n.get(m),x=v.envMap,g=v.envMapRotation;x&&(p.envMap.value=x,p.envMapRotation.value.setFromMatrix4(Xv.makeRotationFromEuler(g)).transpose(),x.isCubeTexture&&x.isRenderTargetTexture===!1&&p.envMapRotation.value.premultiply(Gu),p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio),m.lightMap&&(p.lightMap.value=m.lightMap,p.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,p.lightMapTransform)),m.aoMap&&(p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,p.aoMapTransform))}function a(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform))}function s(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function l(p,m,v,x){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*v,p.scale.value=x*.5,m.map&&(p.map.value=m.map,t(m.map,p.uvTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function c(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function f(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,1e-4)}function u(p,m){m.gradientMap&&(p.gradientMap.value=m.gradientMap)}function d(p,m){p.metalness.value=m.metalness,m.metalnessMap&&(p.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,p.metalnessMapTransform)),p.roughness.value=m.roughness,m.roughnessMap&&(p.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,p.roughnessMapTransform)),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)}function h(p,m,v){p.ior.value=m.ior,m.sheen>0&&(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(p.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,p.sheenColorMapTransform)),m.sheenRoughnessMap&&(p.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,p.sheenRoughnessMapTransform))),m.clearcoat>0&&(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(p.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,p.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(p.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===kt&&p.clearcoatNormalScale.value.negate())),m.dispersion>0&&(p.dispersion.value=m.dispersion),m.retroreflectivity>0&&(p.retroreflectivity.value=m.retroreflectivity),m.iridescence>0&&(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(p.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,p.iridescenceMapTransform)),m.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),m.transmission>0&&(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=v.texture,p.transmissionSamplerSize.value.set(v.width,v.height),m.transmissionMap&&(p.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,p.transmissionMapTransform)),p.thickness.value=m.thickness,m.thicknessMap&&(p.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(p.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap&&(p.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,p.specularColorMapTransform)),m.specularIntensityMap&&(p.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,p.specularIntensityMapTransform))}function _(p,m){m.matcap&&(p.matcap.value=m.matcap)}function T(p,m){let v=n.get(m).light;p.referencePosition.value.setFromMatrixPosition(v.matrixWorld),p.nearDistance.value=v.shadow.camera.near,p.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:o}}function Kv(e,n,t,r){let o={},i={},a=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function l(g,E){let b=E.program;r.uniformBlockBinding(g,b)}function c(g,E){let b=o[g.id];b===void 0&&(p(g),b=f(g),o[g.id]=b,g.addEventListener("dispose",v));let w=E.program;r.updateUBOMapping(g,w);let S=n.render.frame;i[g.id]!==S&&(d(g),i[g.id]=S)}function f(g){let E=u();g.__bindingPointIndex=E;let b=e.createBuffer(),w=g.__size,S=g.usage;return e.bindBuffer(e.UNIFORM_BUFFER,b),e.bufferData(e.UNIFORM_BUFFER,w,S),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,E,b),b}function u(){for(let g=0;g<s;g++)if(a.indexOf(g)===-1)return a.push(g),g;return it("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(g){let E=o[g.id],b=g.uniforms,w=g.__cache;e.bindBuffer(e.UNIFORM_BUFFER,E);for(let S=0,A=b.length;S<A;S++){let C=b[S];if(Array.isArray(C))for(let P=0,D=C.length;P<D;P++)h(C[P],S,P,w);else h(C,S,0,w)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function h(g,E,b,w){if(T(g,E,b,w)===!0){let S=g.__offset,A=g.value;if(Array.isArray(A)){let C=0;for(let P=0;P<A.length;P++){let D=A[P],U=m(D);_(D,g.__data,C),typeof D!="number"&&typeof D!="boolean"&&!D.isMatrix3&&!ArrayBuffer.isView(D)&&(C+=U.storage/Float32Array.BYTES_PER_ELEMENT)}}else _(A,g.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,S,g.__data)}}function _(g,E,b){typeof g=="number"||typeof g=="boolean"?E[0]=g:g.isMatrix3?(E[0]=g.elements[0],E[1]=g.elements[1],E[2]=g.elements[2],E[3]=0,E[4]=g.elements[3],E[5]=g.elements[4],E[6]=g.elements[5],E[7]=0,E[8]=g.elements[6],E[9]=g.elements[7],E[10]=g.elements[8],E[11]=0):ArrayBuffer.isView(g)?E.set(new g.constructor(g.buffer,g.byteOffset,E.length)):g.toArray(E,b)}function T(g,E,b,w){let S=g.value,A=E+"_"+b;if(w[A]===void 0)return typeof S=="number"||typeof S=="boolean"?w[A]=S:ArrayBuffer.isView(S)?w[A]=S.slice():w[A]=S.clone(),!0;{let C=w[A];if(typeof S=="number"||typeof S=="boolean"){if(C!==S)return w[A]=S,!0}else{if(ArrayBuffer.isView(S))return!0;if(C.equals(S)===!1)return C.copy(S),!0}}return!1}function p(g){let E=g.uniforms,b=0,w=16;for(let A=0,C=E.length;A<C;A++){let P=Array.isArray(E[A])?E[A]:[E[A]];for(let D=0,U=P.length;D<U;D++){let L=P[D],F=Array.isArray(L.value)?L.value:[L.value];for(let G=0,H=F.length;G<H;G++){let X=F[G],$=m(X),j=b%w,Z=j%$.boundary,ge=j+Z;b+=Z,ge!==0&&w-ge<$.storage&&(b+=w-ge),L.__data=new Float32Array($.storage/Float32Array.BYTES_PER_ELEMENT),L.__offset=b,b+=$.storage}}}let S=b%w;return S>0&&(b+=w-S),g.__size=b,g.__cache={},this}function m(g){let E={boundary:0,storage:0};return typeof g=="number"||typeof g=="boolean"?(E.boundary=4,E.storage=4):g.isVector2?(E.boundary=8,E.storage=8):g.isVector3||g.isColor?(E.boundary=16,E.storage=12):g.isVector4?(E.boundary=16,E.storage=16):g.isMatrix3?(E.boundary=48,E.storage=48):g.isMatrix4?(E.boundary=64,E.storage=64):g.isTexture?qe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(g)?(E.boundary=16,E.storage=g.byteLength):qe("WebGLRenderer: Unsupported uniform value type.",g),E}function v(g){let E=g.target;E.removeEventListener("dispose",v);let b=a.indexOf(E.__bindingPointIndex);a.splice(b,1),e.deleteBuffer(o[E.id]),delete o[E.id],delete i[E.id]}function x(){for(let g in o)e.deleteBuffer(o[g]);a=[],o={},i={}}return{bind:l,update:c,dispose:x}}var Yv=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Mn=null;function qv(){return Mn===null&&(Mn=new Gn(Yv,16,16,nr,xn),Mn.name="DFG_LUT",Mn.minFilter=St,Mn.magFilter=St,Mn.wrapS=Qo,Mn.wrapT=Qo,Mn.generateMipmaps=!1,Mn.needsUpdate=!0),Mn}var Uu=class{constructor(n={}){let{canvas:t=Hf(),context:r=null,depth:o=!0,stencil:i=!1,alpha:a=!1,antialias:s=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:f="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:h=Kt}=n;this.isWebGLRenderer=!0;let _;if(r!==null){if(typeof WebGLRenderingContext<"u"&&r instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");_=r.getContextAttributes().alpha}else _=a;let T=h,p=new Set([Ca,ya,Ra]),m=new Set([Kt,Bn,uo,Lr,wa,Aa]),v=new Uint32Array(4),x=new Int32Array(4),g=new te,E=null,b=null,w=[],S=[],A=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=cn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let C=this,P=!1,D=null,U=null,L=null,F=null;this._outputColorSpace=Dr;let G=0,H=0,X=null,$=-1,j=null,Z=new Lt,ge=new Lt,_e=null,ke=new ye(0),Xe=0,Ve=t.width,Y=t.height,J=1,Ee=null,Ue=null,ve=new Lt(0,0,Ve,Y),ze=new Lt(0,0,Ve,Y),Mt=!1,Oe=new gs,$e=!1,nt=!1,He=new qt,lt=new te,Rt=new Lt,Bt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ut=!1;function _t(){return X===null?J:1}let O=r;function Ut(R,I){return t.getContext(R,I)}let Ze,y,M,B,z,K,re,oe,q,ee,ie,be,fe,ae,we,Re,Le,N,se,Q,le,he,ne;try{let R={alpha:!0,depth:o,stencil:i,antialias:s,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:f,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",rt,!1),t.addEventListener("webglcontextrestored",Ke,!1),t.addEventListener("webglcontextcreationerror",ln,!1),O===null){let I="webgl2";if(O=Ut(I,R),O===null)throw Ut(I)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ae()}catch(R){throw t.removeEventListener("webglcontextlost",rt,!1),t.removeEventListener("webglcontextrestored",Ke,!1),t.removeEventListener("webglcontextcreationerror",ln,!1),it("WebGLRenderer: "+R.message),R}function Ae(){Ze=new n_(O),Ze.init(),le=new Vv(O,Ze),y=new $g(O,Ze,n,le),M=new Gv(O,Ze),y.reversedDepthBuffer&&d&&M.buffers.depth.setReversed(!0),U=O.createFramebuffer(),L=O.createFramebuffer(),F=O.createFramebuffer(),B=new i_(O),z=new Av,K=new kv(O,Ze,M,z,y,le,B),re=new t_(C),oe=new sm(O),he=new Wg(O,oe),q=new r_(O,oe,B,he),ee=new s_(O,q,oe,he,B),N=new a_(O,y,K),we=new Kg(z),ie=new wv(C,re,Ze,y,he,we),be=new $v(C,z),fe=new yv,ae=new Iv(Ze),Le=new zg(C,re,M,ee,_,l),Re=new Bv(C,ee,y),ne=new Kv(O,B,y,M),se=new Xg(O,Ze,B),Q=new o_(O,Ze,B),B.programs=ie.programs,C.capabilities=y,C.extensions=Ze,C.properties=z,C.renderLists=fe,C.shadowMap=Re,C.state=M,C.info=B}T!==Kt&&(A=new c_(T,t.width,t.height,s,o,i));let Me=new zs(C,O);this.xr=Me,this.getContext=function(){return O},this.getContextAttributes=function(){return O.getContextAttributes()},this.forceContextLoss=function(){let R=Ze.get("WEBGL_lose_context");R&&R.loseContext()},this.forceContextRestore=function(){let R=Ze.get("WEBGL_lose_context");R&&R.restoreContext()},this.getPixelRatio=function(){return J},this.setPixelRatio=function(R){R!==void 0&&(J=R,this.setSize(Ve,Y,!1))},this.getSize=function(R){return R.set(Ve,Y)},this.setSize=function(R,I,W=!0){if(Me.isPresenting){qe("WebGLRenderer: Can't change size while VR device is presenting.");return}Ve=R,Y=I,t.width=Math.floor(R*J),t.height=Math.floor(I*J),W===!0&&(t.style.width=R+"px",t.style.height=I+"px"),A!==null&&A.setSize(t.width,t.height),this.setViewport(0,0,R,I)},this.getDrawingBufferSize=function(R){return R.set(Ve*J,Y*J).floor()},this.setDrawingBufferSize=function(R,I,W){Ve=R,Y=I,J=W,t.width=Math.floor(R*W),t.height=Math.floor(I*W),this.setViewport(0,0,R,I)},this.setEffects=function(R){if(T===Kt){it("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(R){for(let I=0;I<R.length;I++)if(R[I].isOutputPass===!0){qe("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}A.setEffects(R||[])},this.getCurrentViewport=function(R){return R.copy(Z)},this.getViewport=function(R){return R.copy(ve)},this.setViewport=function(R,I,W,k){R.isVector4?ve.set(R.x,R.y,R.z,R.w):ve.set(R,I,W,k),M.viewport(Z.copy(ve).multiplyScalar(J).round())},this.getScissor=function(R){return R.copy(ze)},this.setScissor=function(R,I,W,k){R.isVector4?ze.set(R.x,R.y,R.z,R.w):ze.set(R,I,W,k),M.scissor(ge.copy(ze).multiplyScalar(J).round())},this.getScissorTest=function(){return Mt},this.setScissorTest=function(R){M.setScissorTest(Mt=R)},this.setOpaqueSort=function(R){Ee=R},this.setTransparentSort=function(R){Ue=R},this.getClearColor=function(R){return R.copy(Le.getClearColor())},this.setClearColor=function(){Le.setClearColor(...arguments)},this.getClearAlpha=function(){return Le.getClearAlpha()},this.setClearAlpha=function(){Le.setClearAlpha(...arguments)},this.clear=function(R=!0,I=!0,W=!0){let k=0;if(R){let V=!1;if(X!==null){let de=X.texture.format;V=p.has(de)}if(V){let de=X.texture.type,me=m.has(de),ue=Le.getClearColor(),Se=Le.getClearAlpha(),Te=ue.r,De=ue.g,Fe=ue.b;me?(v[0]=Te,v[1]=De,v[2]=Fe,v[3]=Se,O.clearBufferuiv(O.COLOR,0,v)):(x[0]=Te,x[1]=De,x[2]=Fe,x[3]=Se,O.clearBufferiv(O.COLOR,0,x))}else k|=O.COLOR_BUFFER_BIT}I&&(k|=O.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),W&&(k|=O.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),k!==0&&O.clear(k)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(R){R.setRenderer(this),D=R},this.dispose=function(){t.removeEventListener("webglcontextlost",rt,!1),t.removeEventListener("webglcontextrestored",Ke,!1),t.removeEventListener("webglcontextcreationerror",ln,!1),Le.dispose(),fe.dispose(),ae.dispose(),z.dispose(),re.dispose(),ee.dispose(),he.dispose(),ne.dispose(),ie.dispose(),Me.dispose(),Me.removeEventListener("sessionstart",mc),Me.removeEventListener("sessionend",gc),Zn.stop()};function rt(R){R.preventDefault(),ds("WebGLRenderer: Context Lost."),P=!0}function Ke(){ds("WebGLRenderer: Context Restored."),P=!1;let R=B.autoReset,I=Re.enabled,W=Re.autoUpdate,k=Re.needsUpdate,V=Re.type;Ae(),B.autoReset=R,Re.enabled=I,Re.autoUpdate=W,Re.needsUpdate=k,Re.type=V}function ln(R){it("WebGLRenderer: A WebGL context could not be created. Reason: ",R.statusMessage)}function _n(R){let I=R.target;I.removeEventListener("dispose",_n),qp(I)}function qp(R){Zp(R),z.remove(R)}function Zp(R){let I=z.get(R).programs;I!==void 0&&(I.forEach(function(W){ie.releaseProgram(W)}),R.isShaderMaterial&&ie.releaseShaderCache(R))}this.renderBufferDirect=function(R,I,W,k,V,de){I===null&&(I=Bt);let me=V.isMesh&&V.matrixWorld.determinantAffine()<0,ue=Jp(R,I,W,k,V);M.setMaterial(k,me);let Se=W.index,Te=1;if(k.wireframe===!0){if(Se=q.getWireframeAttribute(W),Se===void 0)return;Te=2}let De=W.drawRange,Fe=W.attributes.position,xe=De.start*Te,Ye=(De.start+De.count)*Te;de!==null&&(xe=Math.max(xe,de.start*Te),Ye=Math.min(Ye,(de.start+de.count)*Te)),Se!==null?(xe=Math.max(xe,0),Ye=Math.min(Ye,Se.count)):Fe!=null&&(xe=Math.max(xe,0),Ye=Math.min(Ye,Fe.count));let vt=Ye-xe;if(vt<0||vt===1/0)return;he.setup(V,k,ue,W,Se);let st,et=se;if(Se!==null&&(st=oe.get(Se),et=Q,et.setIndex(st)),V.isMesh)k.wireframe===!0?(M.setLineWidth(k.wireframeLinewidth*_t()),et.setMode(O.LINES)):et.setMode(O.TRIANGLES);else if(V.isLine){let It=k.linewidth;It===void 0&&(It=1),M.setLineWidth(It*_t()),V.isLineSegments?et.setMode(O.LINES):V.isLineLoop?et.setMode(O.LINE_LOOP):et.setMode(O.LINE_STRIP)}else V.isPoints?et.setMode(O.POINTS):V.isSprite&&et.setMode(O.TRIANGLES);if(V.isBatchedMesh)if(Ze.get("WEBGL_multi_draw"))et.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else{let It=V._multiDrawStarts,pe=V._multiDrawCounts,Ft=V._multiDrawCount,We=Se?oe.get(Se).bytesPerElement:1,jt=z.get(k).currentProgram.getUniforms();for(let vn=0;vn<Ft;vn++)jt.setValue(O,"_gl_DrawID",vn),et.render(It[vn]/We,pe[vn])}else if(V.isInstancedMesh)et.renderInstances(xe,vt,V.count);else if(W.isInstancedBufferGeometry){let It=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,pe=Math.min(W.instanceCount,It);et.renderInstances(xe,vt,pe)}else et.render(xe,vt)};function pc(R,I,W,k){D!==null&&R.isNodeMaterial&&D.setObject(k,R),$e===!0&&we.setState(R,W,!1),R.transparent===!0&&R.side===Qt&&R.forceSinglePass===!1?(R.side=kt,R.needsUpdate=!0,$o(R,I,k),R.side=yr,R.needsUpdate=!0,$o(R,I,k),R.side=Qt):$o(R,I,k)}this.compile=function(R,I,W=null){W===null&&(W=R),D!==null&&D.renderStart(R,I,W),b=ae.get(W),b.init(I),S.push(b),W.traverseVisible(function(V){V.isLight&&V.layers.test(I.layers)&&(b.pushLight(V),V.castShadow&&b.pushShadow(V))}),R!==W&&R.traverseVisible(function(V){V.isLight&&V.layers.test(I.layers)&&(b.pushLight(V),V.castShadow&&b.pushShadow(V))}),b.setupLights(),D!==null&&D.updateLights(b.state.lightsArray),nt=this.localClippingEnabled,$e=we.init(this.clippingPlanes,nt),$e===!0&&we.setGlobalState(this.clippingPlanes,I),D!==null&&Re.render(b.state.shadowsArray,W,I);let k=new Set;return R.traverse(function(V){if(!(V.isMesh||V.isPoints||V.isLine||V.isSprite))return;let de=V.material;if(de)if(Array.isArray(de))for(let me=0;me<de.length;me++){let ue=de[me];pc(ue,W,I,V),k.add(ue)}else pc(de,W,I,V),k.add(de)}),b=S.pop(),D!==null&&D.renderEnd(),k},this.compileAsync=function(R,I,W=null){let k=this.compile(R,I,W);return new Promise(V=>{function de(){if(k.forEach(function(me){let Se=z.get(me).currentProgram;(Se===void 0||Se.isReady())&&k.delete(me)}),k.size===0){V(R);return}setTimeout(de,10)}Ze.get("KHR_parallel_shader_compile")!==null?de():setTimeout(de,10)})};let aa=null;function jp(R){aa&&aa(R)}function mc(){Zn.stop()}function gc(){Zn.start()}let Zn=new Iu;Zn.setAnimationLoop(jp),typeof self<"u"&&Zn.setContext(self),this.setAnimationLoop=function(R){aa=R,Me.setAnimationLoop(R),R===null?Zn.stop():Zn.start()},Me.addEventListener("sessionstart",mc),Me.addEventListener("sessionend",gc),this.render=function(R,I){if(I!==void 0&&I.isCamera!==!0){it("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(P===!0)return;D!==null&&D.renderStart(R,I);let W=Me.enabled===!0&&Me.isPresenting===!0,k=A!==null&&(X===null||W)&&A.begin(C,X);if(R.matrixWorldAutoUpdate===!0&&R.updateMatrixWorld(),I.parent===null&&I.matrixWorldAutoUpdate===!0&&I.updateMatrixWorld(),Me.enabled===!0&&Me.isPresenting===!0&&(A===null||A.isCompositing()===!1)&&(Me.cameraAutoUpdate===!0&&Me.updateCamera(I),I=Me.getCamera()),R.isScene===!0&&R.onBeforeRender(C,R,I,X),b=ae.get(R,S.length),b.init(I),b.state.textureUnits=K.getTextureUnits(),S.push(b),He.multiplyMatrices(I.projectionMatrix,I.matrixWorldInverse),Oe.setFromProjectionMatrix(He,us,I.reversedDepth),nt=this.localClippingEnabled,$e=we.init(this.clippingPlanes,nt),E=fe.get(R,w.length),E.init(),w.push(E),Me.enabled===!0&&Me.isPresenting===!0){let me=C.xr.getDepthSensingMesh();me!==null&&sa(me,I,-1/0,C.sortObjects)}sa(R,I,0,C.sortObjects),E.finish(),D!==null&&D.updateLights(b.state.lightsArray),C.sortObjects===!0&&E.sort(Ee,Ue),ut=Me.enabled===!1||Me.isPresenting===!1||Me.hasDepthSensing()===!1,ut&&Le.addToRenderList(E,R),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),$e===!0&&we.beginShadows();let V=b.state.shadowsArray;if(Re.render(V,R,I),$e===!0&&we.endShadows(),(k&&A.hasRenderPass())===!1){let me=E.opaque,ue=E.transmissive;if(b.setupLights(),I.isArrayCamera){let Se=I.cameras;if(ue.length>0)for(let Te=0,De=Se.length;Te<De;Te++){let Fe=Se[Te];vc(me,ue,R,Fe)}ut&&Le.render(R);for(let Te=0,De=Se.length;Te<De;Te++){let Fe=Se[Te];_c(E,R,Fe,Fe.viewport)}}else ue.length>0&&vc(me,ue,R,I),ut&&Le.render(R),_c(E,R,I)}X!==null&&H===0&&(K.updateMultisampleRenderTarget(X),K.updateRenderTargetMipmap(X)),k&&A.end(C),R.isScene===!0&&R.onAfterRender(C,R,I),he.resetDefaultState(),$=-1,j=null,S.pop(),S.length>0?(b=S[S.length-1],K.setTextureUnits(b.state.textureUnits),$e===!0&&we.setGlobalState(C.clippingPlanes,b.state.camera)):b=null,w.pop(),w.length>0?E=w[w.length-1]:E=null,D!==null&&D.renderEnd()};function sa(R,I,W,k){if(R.visible===!1)return;if(R.layers.test(I.layers)){if(R.isGroup)W=R.renderOrder;else if(R.isLOD)R.autoUpdate===!0&&R.update(I);else if(R.isLightProbeGrid)b.pushLightProbeGrid(R);else if(R.isLight)b.pushLight(R),R.castShadow&&b.pushShadow(R);else if(R.isSprite){if(!R.frustumCulled||R.intersectsFrustum(Oe)){k&&Rt.setFromMatrixPosition(R.matrixWorld).applyMatrix4(He);let me=ee.update(R),ue=R.material;ue.visible&&E.push(R,me,ue,W,Rt.z,null,I)}}else if((R.isMesh||R.isLine||R.isPoints)&&(!R.frustumCulled||R.intersectsFrustum(Oe))){let me=ee.update(R),ue=R.material;if(k&&(R.boundingSphere!==void 0?(R.boundingSphere===null&&R.computeBoundingSphere(),Rt.copy(R.boundingSphere.center)):(me.boundingSphere===null&&me.computeBoundingSphere(),Rt.copy(me.boundingSphere.center)),Rt.applyMatrix4(R.matrixWorld).applyMatrix4(He)),Array.isArray(ue)){let Se=me.groups;for(let Te=0,De=Se.length;Te<De;Te++){let Fe=Se[Te],xe=ue[Fe.materialIndex];xe&&xe.visible&&E.push(R,me,xe,W,Rt.z,Fe,I)}}else ue.visible&&E.push(R,me,ue,W,Rt.z,null,I)}}let de=R.children;for(let me=0,ue=de.length;me<ue;me++)sa(de[me],I,W,k)}function _c(R,I,W,k){let{opaque:V,transmissive:de,transparent:me}=R;b.setupLightsView(W),$e===!0&&we.setGlobalState(C.clippingPlanes,W),k&&M.viewport(Z.copy(k)),V.length>0&&Xo(V,I,W),de.length>0&&Xo(de,I,W),me.length>0&&Xo(me,I,W),M.buffers.depth.setTest(!0),M.buffers.depth.setMask(!0),M.buffers.color.setMask(!0),M.setPolygonOffset(!1)}function vc(R,I,W,k){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(b.state.transmissionRenderTarget[k.id]===void 0){let xe=Ze.has("EXT_color_buffer_half_float")||Ze.has("EXT_color_buffer_float");b.state.transmissionRenderTarget[k.id]=new en(1,1,{generateMipmaps:!0,type:xe?xn:Kt,minFilter:$t,samples:Math.max(4,y.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ct.workingColorSpace})}let de=b.state.transmissionRenderTarget[k.id],me=k.viewport||Z;de.setSize(me.z*C.transmissionResolutionScale,me.w*C.transmissionResolutionScale);let ue=C.getRenderTarget(),Se=C.getActiveCubeFace(),Te=C.getActiveMipmapLevel();C.setRenderTarget(de),C.getClearColor(ke),Xe=C.getClearAlpha(),Xe<1&&C.setClearColor(16777215,.5),C.clear(),ut&&Le.render(W);let De=C.toneMapping;C.toneMapping=cn;let Fe=k.viewport;if(k.viewport!==void 0&&(k.viewport=void 0),b.setupLightsView(k),$e===!0&&we.setGlobalState(C.clippingPlanes,k),Xo(R,W,k),K.updateMultisampleRenderTarget(de),K.updateRenderTargetMipmap(de),Ze.has("WEBGL_multisampled_render_to_texture")===!1){let xe=!1;for(let Ye=0,vt=I.length;Ye<vt;Ye++){let st=I[Ye],{object:et,geometry:It,material:pe,group:Ft}=st;if(pe.side===Qt&&et.layers.test(k.layers)){let We=pe.side;pe.side=kt,pe.needsUpdate=!0,Sc(et,W,k,It,pe,Ft),pe.side=We,pe.needsUpdate=!0,xe=!0}}xe===!0&&(K.updateMultisampleRenderTarget(de),K.updateRenderTargetMipmap(de))}C.setRenderTarget(ue,Se,Te),C.setClearColor(ke,Xe),Fe!==void 0&&(k.viewport=Fe),C.toneMapping=De}function Xo(R,I,W){let k=I.isScene===!0?I.overrideMaterial:null;for(let V=0,de=R.length;V<de;V++){let me=R[V],{object:ue,geometry:Se,group:Te}=me,De=me.material;De.allowOverride===!0&&k!==null&&(De=k),ue.layers.test(W.layers)&&Sc(ue,I,W,Se,De,Te)}}function Sc(R,I,W,k,V,de){D!==null&&V.isNodeMaterial&&D.setObject(R,V),R.onBeforeRender(C,I,W,k,V,de),R.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,R.matrixWorld),R.normalMatrix.getNormalMatrix(R.modelViewMatrix),V.onBeforeRender(C,I,W,k,R,de),V.transparent===!0&&V.side===Qt&&V.forceSinglePass===!1?(V.side=kt,V.needsUpdate=!0,C.renderBufferDirect(W,I,k,V,R,de),V.side=yr,V.needsUpdate=!0,C.renderBufferDirect(W,I,k,V,R,de),V.side=Qt):C.renderBufferDirect(W,I,k,V,R,de),R.onAfterRender(C,I,W,k,V,de)}function $o(R,I,W){I.isScene!==!0&&(I=Bt);let k=z.get(R),V=b.state.lights,de=b.state.shadowsArray,me=V.state.version,ue=ie.getParameters(R,V.state,de,I,W,b.state.lightProbeGridArray),Se=ie.getProgramCacheKey(ue),Te=k.programs;k.environment=R.isMeshStandardMaterial||R.isMeshLambertMaterial||R.isMeshPhongMaterial?I.environment:null,k.fog=I.fog;let De=R.isMeshStandardMaterial||R.isMeshLambertMaterial&&!R.envMap||R.isMeshPhongMaterial&&!R.envMap;k.envMap=re.get(R.envMap||k.environment,De),k.envMapRotation=k.environment!==null&&R.envMap===null?I.environmentRotation:R.envMapRotation,Te===void 0&&(R.addEventListener("dispose",_n),Te=new Map,k.programs=Te);let Fe=Te.get(Se);if(Fe!==void 0){if(k.currentProgram===Fe&&k.lightsStateVersion===me)return Ec(R,ue),Fe}else ue.uniforms=ie.getUniforms(R),D!==null&&R.isNodeMaterial&&D.build(R,W,ue),R.onBeforeCompile(ue,C),Fe=ie.acquireProgram(ue,Se),Te.set(Se,Fe),k.uniforms=ue.uniforms;let xe=k.uniforms;return(!R.isShaderMaterial&&!R.isRawShaderMaterial||R.clipping===!0)&&(xe.clippingPlanes=we.uniform),Ec(R,ue),k.needsLights=tm(R),k.lightsStateVersion=me,k.needsLights&&(xe.ambientLightColor.value=V.state.ambient,xe.lightProbe.value=V.state.probe,xe.sunLights.value=V.state.sun,xe.sunLightShadows.value=V.state.sunShadow,xe.directionalLights.value=V.state.directional,xe.directionalLightShadows.value=V.state.directionalShadow,xe.spotLights.value=V.state.spot,xe.spotLightShadows.value=V.state.spotShadow,xe.rectAreaLights.value=V.state.rectArea,xe.ltc_1.value=V.state.rectAreaLTC1,xe.ltc_2.value=V.state.rectAreaLTC2,xe.pointLights.value=V.state.point,xe.pointLightShadows.value=V.state.pointShadow,xe.hemisphereLights.value=V.state.hemi,xe.sunShadowMatrix.value=V.state.sunShadowMatrix,xe.sunShadowCascade.value=V.state.sunShadowCascade,xe.directionalShadowMatrix.value=V.state.directionalShadowMatrix,xe.spotLightMatrix.value=V.state.spotLightMatrix,xe.spotLightMap.value=V.state.spotLightMap,xe.pointShadowMatrix.value=V.state.pointShadowMatrix),k.lightProbeGrid=b.state.lightProbeGridArray.length>0,k.currentProgram=Fe,k.uniformsList=null,Fe}function xc(R){if(R.uniformsList===null){let I=R.currentProgram.getUniforms();R.uniformsList=Fr.seqWithValue(I.seq,R.uniforms)}return R.uniformsList}function Ec(R,I){let W=z.get(R);W.outputColorSpace=I.outputColorSpace,W.batching=I.batching,W.batchingColor=I.batchingColor,W.instancing=I.instancing,W.instancingColor=I.instancingColor,W.instancingMorph=I.instancingMorph,W.skinning=I.skinning,W.morphTargets=I.morphTargets,W.morphNormals=I.morphNormals,W.morphColors=I.morphColors,W.morphTargetsCount=I.morphTargetsCount,W.numClippingPlanes=I.numClippingPlanes,W.numIntersection=I.numClipIntersection,W.vertexAlphas=I.vertexAlphas,W.vertexTangents=I.vertexTangents,W.toneMapping=I.toneMapping}function Qp(R,I){if(R.length===0)return null;if(R.length===1)return R[0].texture!==null?R[0]:null;g.setFromMatrixPosition(I.matrixWorld);for(let W=0,k=R.length;W<k;W++){let V=R[W];if(V.texture!==null&&V.boundingBox.containsPoint(g))return V}return null}function Jp(R,I,W,k,V){I.isScene!==!0&&(I=Bt),K.resetTextureUnits();let de=I.fog,me=k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial?I.environment:null,ue=X===null?C.outputColorSpace:X.isXRRenderTarget===!0?X.texture.colorSpace:ct.workingColorSpace,Se=k.isMeshStandardMaterial||k.isMeshLambertMaterial&&!k.envMap||k.isMeshPhongMaterial&&!k.envMap,Te=re.get(k.envMap||me,Se),De=k.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Fe=!!W.attributes.tangent&&(!!k.normalMap||k.anisotropy>0),xe=!!W.morphAttributes.position,Ye=!!W.morphAttributes.normal,vt=!!W.morphAttributes.color,st=cn;k.toneMapped&&(X===null||X.isXRRenderTarget===!0)&&(st=C.toneMapping);let et=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,It=et!==void 0?et.length:0,pe=z.get(k),Ft=b.state.lights;if($e===!0&&(nt===!0||R!==j)){let ot=R===j&&k.id===$;we.setState(k,R,ot)}let We=!1;k.version===pe.__version?(pe.needsLights&&pe.lightsStateVersion!==Ft.state.version||pe.outputColorSpace!==ue||V.isBatchedMesh&&pe.batching===!1||!V.isBatchedMesh&&pe.batching===!0||V.isBatchedMesh&&pe.batchingColor===!0&&V._colorsTexture===null||V.isBatchedMesh&&pe.batchingColor===!1&&V._colorsTexture!==null||V.isInstancedMesh&&pe.instancing===!1||!V.isInstancedMesh&&pe.instancing===!0||V.isSkinnedMesh&&pe.skinning===!1||!V.isSkinnedMesh&&pe.skinning===!0||V.isInstancedMesh&&pe.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&pe.instancingColor===!1&&V.instanceColor!==null||V.isInstancedMesh&&pe.instancingMorph===!0&&V.morphTexture===null||V.isInstancedMesh&&pe.instancingMorph===!1&&V.morphTexture!==null||pe.envMap!==Te||k.fog===!0&&pe.fog!==de||pe.numClippingPlanes!==void 0&&(pe.numClippingPlanes!==we.numPlanes||pe.numIntersection!==we.numIntersection)||pe.vertexAlphas!==De||pe.vertexTangents!==Fe||pe.morphTargets!==xe||pe.morphNormals!==Ye||pe.morphColors!==vt||pe.toneMapping!==st||pe.morphTargetsCount!==It||!!pe.lightProbeGrid!=b.state.lightProbeGridArray.length>0)&&(We=!0):(We=!0,pe.__version=k.version);let jt=pe.currentProgram;We===!0&&(jt=$o(k,I,V),D&&k.isNodeMaterial&&D.onUpdateProgram(k,jt,pe));let vn=!1,Nn=!1,Er=!1,Qe=jt.getUniforms(),gt=pe.uniforms;if(M.useProgram(jt.program)&&(vn=!0,Nn=!0,Er=!0),k.id!==$&&($=k.id,Nn=!0),pe.needsLights){let ot=Qp(b.state.lightProbeGridArray,V);pe.lightProbeGrid!==ot&&(pe.lightProbeGrid=ot,Nn=!0)}if(vn||j!==R){M.buffers.depth.getReversed()&&R.reversedDepth!==!0&&(R._reversedDepth=!0,R.updateProjectionMatrix()),Qe.setValue(O,"projectionMatrix",R.projectionMatrix),Qe.setValue(O,"viewMatrix",R.matrixWorldInverse);let Fn=Qe.map.cameraPosition;Fn!==void 0&&Fn.setValue(O,lt.setFromMatrixPosition(R.matrixWorld)),y.logarithmicDepthBuffer&&Qe.setValue(O,"logDepthBufFC",2/(Math.log(R.far+1)/Math.LN2)),(k.isMeshPhongMaterial||k.isMeshToonMaterial||k.isMeshLambertMaterial||k.isMeshBasicMaterial||k.isMeshStandardMaterial||k.isShaderMaterial)&&Qe.setValue(O,"isOrthographic",R.isOrthographicCamera===!0),j!==R&&(j=R,Nn=!0,Er=!0)}if(pe.needsLights&&(Ft.state.sunShadowMap.length>0&&Qe.setValue(O,"sunShadowMap",Ft.state.sunShadowMap,K),Ft.state.directionalShadowMap.length>0&&Qe.setValue(O,"directionalShadowMap",Ft.state.directionalShadowMap,K),Ft.state.spotShadowMap.length>0&&Qe.setValue(O,"spotShadowMap",Ft.state.spotShadowMap,K),Ft.state.pointShadowMap.length>0&&Qe.setValue(O,"pointShadowMap",Ft.state.pointShadowMap,K)),V.isSkinnedMesh){Qe.setOptional(O,V,"bindMatrix"),Qe.setOptional(O,V,"bindMatrixInverse");let ot=V.skeleton;ot&&(ot.boneTexture===null&&ot.computeBoneTexture(),Qe.setValue(O,"boneTexture",ot.boneTexture,K))}V.isBatchedMesh&&(Qe.setOptional(O,V,"batchingTexture"),Qe.setValue(O,"batchingTexture",V._matricesTexture,K),Qe.setOptional(O,V,"batchingIdTexture"),Qe.setValue(O,"batchingIdTexture",V._indirectTexture,K),Qe.setOptional(O,V,"batchingColorTexture"),V._colorsTexture!==null&&Qe.setValue(O,"batchingColorTexture",V._colorsTexture,K));let On=W.morphAttributes;if((On.position!==void 0||On.normal!==void 0||On.color!==void 0)&&N.update(V,W,jt),(Nn||pe.receiveShadow!==V.receiveShadow)&&(pe.receiveShadow=V.receiveShadow,Qe.setValue(O,"receiveShadow",V.receiveShadow)),(k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial)&&k.envMap===null&&I.environment!==null&&(gt.envMapIntensity.value=I.environmentIntensity),gt.dfgLUT!==void 0&&(gt.dfgLUT.value=qv()),Nn){if(Qe.setValue(O,"toneMappingExposure",C.toneMappingExposure),pe.needsLights&&em(gt,Er),de&&k.fog===!0&&be.refreshFogUniforms(gt,de),be.refreshMaterialUniforms(gt,k,J,Y,b.state.transmissionRenderTarget[R.id]),pe.needsLights&&pe.lightProbeGrid){let ot=pe.lightProbeGrid;gt.probesSH.value=ot.texture,gt.probesMin.value.copy(ot.boundingBox.min),gt.probesMax.value.copy(ot.boundingBox.max),gt.probesResolution.value.copy(ot.resolution)}Fr.upload(O,xc(pe),gt,K)}if(k.isShaderMaterial&&k.uniformsNeedUpdate===!0&&(Fr.upload(O,xc(pe),gt,K),k.uniformsNeedUpdate=!1),k.isSpriteMaterial&&Qe.setValue(O,"center",V.center),Qe.setValue(O,"modelViewMatrix",V.modelViewMatrix),Qe.setValue(O,"normalMatrix",V.normalMatrix),Qe.setValue(O,"modelMatrix",V.matrixWorld),k.uniformsGroups!==void 0){let ot=k.uniformsGroups;for(let Fn=0,Mr=ot.length;Fn<Mr;Fn++){let Tc=ot[Fn];ne.update(Tc,jt),ne.bind(Tc,jt)}}return jt}function em(R,I){R.ambientLightColor.needsUpdate=I,R.lightProbe.needsUpdate=I,R.sunLights.needsUpdate=I,R.sunLightShadows.needsUpdate=I,R.directionalLights.needsUpdate=I,R.directionalLightShadows.needsUpdate=I,R.pointLights.needsUpdate=I,R.pointLightShadows.needsUpdate=I,R.spotLights.needsUpdate=I,R.spotLightShadows.needsUpdate=I,R.rectAreaLights.needsUpdate=I,R.hemisphereLights.needsUpdate=I}function tm(R){return R.isMeshLambertMaterial||R.isMeshToonMaterial||R.isMeshPhongMaterial||R.isMeshStandardMaterial||R.isShadowMaterial||R.isShaderMaterial&&R.lights===!0}this.getActiveCubeFace=function(){return G},this.getActiveMipmapLevel=function(){return H},this.getRenderTarget=function(){return X},this.setRenderTargetTextures=function(R,I,W){let k=z.get(R);k.__autoAllocateDepthBuffer=R.resolveDepthBuffer===!1,k.__autoAllocateDepthBuffer===!1&&(k.__useRenderToTexture=!1),z.get(R.texture).__webglTexture=I,z.get(R.depthTexture).__webglTexture=k.__autoAllocateDepthBuffer?void 0:W,k.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(R,I){let W=z.get(R);W.__webglFramebuffer=I,W.__useDefaultFramebuffer=I===void 0},this.setRenderTarget=function(R,I=0,W=0){X=R,G=I,H=W;let k=null,V=!1,de=!1;if(R){let ue=z.get(R);if(ue.__useDefaultFramebuffer!==void 0){M.bindFramebuffer(O.FRAMEBUFFER,ue.__webglFramebuffer),Z.copy(R.viewport),ge.copy(R.scissor),_e=R.scissorTest,M.viewport(Z),M.scissor(ge),M.setScissorTest(_e),$=-1;return}else if(ue.__webglFramebuffer===void 0)K.setupRenderTarget(R);else if(ue.__hasExternalTextures)K.rebindTextures(R,z.get(R.texture).__webglTexture,z.get(R.depthTexture).__webglTexture);else if(R.depthBuffer){let De=R.depthTexture;if(ue.__boundDepthTexture!==De){if(De!==null&&z.has(De)&&(R.width!==De.image.width||R.height!==De.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");K.setupDepthRenderbuffer(R)}}let Se=R.texture;(Se.isData3DTexture||Se.isDataArrayTexture||Se.isCompressedArrayTexture)&&(de=!0);let Te=z.get(R).__webglFramebuffer;R.isWebGLCubeRenderTarget?(Array.isArray(Te[I])?k=Te[I][W]:k=Te[I],V=!0):R.samples>0&&K.useMultisampledRTT(R)===!1?k=z.get(R).__webglMultisampledFramebuffer:Array.isArray(Te)?k=Te[W]:k=Te,Z.copy(R.viewport),ge.copy(R.scissor),_e=R.scissorTest}else Z.copy(ve).multiplyScalar(J).floor(),ge.copy(ze).multiplyScalar(J).floor(),_e=Mt;if(W!==0&&(k=U),M.bindFramebuffer(O.FRAMEBUFFER,k)&&M.drawBuffers(R,k),M.viewport(Z),M.scissor(ge),M.setScissorTest(_e),V){let ue=z.get(R.texture);O.framebufferTexture2D(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_CUBE_MAP_POSITIVE_X+I,ue.__webglTexture,W)}else if(de){let ue=I;for(let Se=0;Se<R.textures.length;Se++){let Te=z.get(R.textures[Se]);O.framebufferTextureLayer(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0+Se,Te.__webglTexture,W,ue)}}else if(R!==null&&W!==0){let ue=z.get(R.texture);O.framebufferTexture2D(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_2D,ue.__webglTexture,W)}$=-1};function Mc(R){let I=z.get(R);return(I.__readFormat!==R.format||I.__readType!==R.type)&&(I.__readFormat=R.format,I.__readType=R.type,I.__formatReadable=y.textureFormatReadable(R.format),I.__typeReadable=y.textureTypeReadable(R.type)),I}this.readRenderTargetPixels=function(R,I,W,k,V,de,me,ue=0){if(!(R&&R.isWebGLRenderTarget)){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Se=z.get(R).__webglFramebuffer;if(R.isWebGLCubeRenderTarget&&me!==void 0&&(Se=Se[me]),Se){M.bindFramebuffer(O.FRAMEBUFFER,Se);try{let Te=R.textures[ue],De=Te.format,Fe=Te.type;R.textures.length>1&&O.readBuffer(O.COLOR_ATTACHMENT0+ue);let xe=Mc(Te);if(xe.__formatReadable===!1){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(xe.__typeReadable===!1){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}I>=0&&I<=R.width-k&&W>=0&&W<=R.height-V&&O.readPixels(I,W,k,V,le.convert(De),le.convert(Fe),de)}finally{let Te=X!==null?z.get(X).__webglFramebuffer:null;M.bindFramebuffer(O.FRAMEBUFFER,Te)}}},this.readRenderTargetPixelsAsync=async function(R,I,W,k,V,de,me,ue=0){if(!(R&&R.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Se=z.get(R).__webglFramebuffer;if(R.isWebGLCubeRenderTarget&&me!==void 0&&(Se=Se[me]),Se)if(I>=0&&I<=R.width-k&&W>=0&&W<=R.height-V){M.bindFramebuffer(O.FRAMEBUFFER,Se);let Te=R.textures[ue],De=Te.format,Fe=Te.type;R.textures.length>1&&O.readBuffer(O.COLOR_ATTACHMENT0+ue);let xe=Mc(Te);if(xe.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(xe.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ye=O.createBuffer();O.bindBuffer(O.PIXEL_PACK_BUFFER,Ye),O.bufferData(O.PIXEL_PACK_BUFFER,de.byteLength,O.STREAM_READ),O.readPixels(I,W,k,V,le.convert(De),le.convert(Fe),0),O.bindBuffer(O.PIXEL_PACK_BUFFER,null);let vt=X!==null?z.get(X).__webglFramebuffer:null;M.bindFramebuffer(O.FRAMEBUFFER,vt);let st=O.fenceSync(O.SYNC_GPU_COMMANDS_COMPLETE,0);return O.flush(),await Gf(O,st,4),O.bindBuffer(O.PIXEL_PACK_BUFFER,Ye),O.getBufferSubData(O.PIXEL_PACK_BUFFER,0,de),O.bindBuffer(O.PIXEL_PACK_BUFFER,null),O.deleteBuffer(Ye),O.deleteSync(st),de}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(R,I=null,W=0){let k=Math.pow(2,-W),V=Math.floor(R.image.width*k),de=Math.floor(R.image.height*k),me=I!==null?I.x:0,ue=I!==null?I.y:0;K.setTexture2D(R,0),O.copyTexSubImage2D(O.TEXTURE_2D,W,0,0,me,ue,V,de),M.unbindTexture()},this.copyTextureToTexture=function(R,I,W=null,k=null,V=0,de=0){let me,ue,Se,Te,De,Fe,xe,Ye,vt,st=R.isCompressedTexture?R.mipmaps[de]:R.image;if(W!==null)me=W.max.x-W.min.x,ue=W.max.y-W.min.y,Se=W.isBox3?W.max.z-W.min.z:1,Te=W.min.x,De=W.min.y,Fe=W.isBox3?W.min.z:0;else{let gt=Math.pow(2,-V);me=Math.floor(st.width*gt),ue=Math.floor(st.height*gt),R.isDataArrayTexture?Se=st.depth:R.isData3DTexture?Se=Math.floor(st.depth*gt):Se=1,Te=0,De=0,Fe=0}k!==null?(xe=k.x,Ye=k.y,vt=k.z):(xe=0,Ye=0,vt=0);let et=le.convert(I.format),It=le.convert(I.type),pe;I.isData3DTexture?(K.setTexture3D(I,0),pe=O.TEXTURE_3D):I.isDataArrayTexture||I.isCompressedArrayTexture?(K.setTexture2DArray(I,0),pe=O.TEXTURE_2D_ARRAY):(K.setTexture2D(I,0),pe=O.TEXTURE_2D),M.activeTexture(O.TEXTURE0),M.pixelStorei(O.UNPACK_FLIP_Y_WEBGL,I.flipY),M.pixelStorei(O.UNPACK_PREMULTIPLY_ALPHA_WEBGL,I.premultiplyAlpha),M.pixelStorei(O.UNPACK_ALIGNMENT,I.unpackAlignment);let Ft=M.getParameter(O.UNPACK_ROW_LENGTH),We=M.getParameter(O.UNPACK_IMAGE_HEIGHT),jt=M.getParameter(O.UNPACK_SKIP_PIXELS),vn=M.getParameter(O.UNPACK_SKIP_ROWS),Nn=M.getParameter(O.UNPACK_SKIP_IMAGES);M.pixelStorei(O.UNPACK_ROW_LENGTH,st.width),M.pixelStorei(O.UNPACK_IMAGE_HEIGHT,st.height),M.pixelStorei(O.UNPACK_SKIP_PIXELS,Te),M.pixelStorei(O.UNPACK_SKIP_ROWS,De),M.pixelStorei(O.UNPACK_SKIP_IMAGES,Fe);let Er=R.isDataArrayTexture||R.isData3DTexture,Qe=I.isDataArrayTexture||I.isData3DTexture;if(R.isDepthTexture){let gt=z.get(R),On=z.get(I),ot=z.get(gt.__renderTarget),Fn=z.get(On.__renderTarget);M.bindFramebuffer(O.READ_FRAMEBUFFER,ot.__webglFramebuffer),M.bindFramebuffer(O.DRAW_FRAMEBUFFER,Fn.__webglFramebuffer);for(let Mr=0;Mr<Se;Mr++)Er&&(O.framebufferTextureLayer(O.READ_FRAMEBUFFER,O.COLOR_ATTACHMENT0,z.get(R).__webglTexture,V,Fe+Mr),O.framebufferTextureLayer(O.DRAW_FRAMEBUFFER,O.COLOR_ATTACHMENT0,z.get(I).__webglTexture,de,vt+Mr)),O.blitFramebuffer(Te,De,me,ue,xe,Ye,me,ue,O.DEPTH_BUFFER_BIT,O.NEAREST);M.bindFramebuffer(O.READ_FRAMEBUFFER,null),M.bindFramebuffer(O.DRAW_FRAMEBUFFER,null)}else if(V!==0||R.isRenderTargetTexture||z.has(R)){let gt=z.get(R),On=z.get(I);M.bindFramebuffer(O.READ_FRAMEBUFFER,L),M.bindFramebuffer(O.DRAW_FRAMEBUFFER,F);for(let ot=0;ot<Se;ot++)Er?O.framebufferTextureLayer(O.READ_FRAMEBUFFER,O.COLOR_ATTACHMENT0,gt.__webglTexture,V,Fe+ot):O.framebufferTexture2D(O.READ_FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_2D,gt.__webglTexture,V),Qe?O.framebufferTextureLayer(O.DRAW_FRAMEBUFFER,O.COLOR_ATTACHMENT0,On.__webglTexture,de,vt+ot):O.framebufferTexture2D(O.DRAW_FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_2D,On.__webglTexture,de),V!==0?O.blitFramebuffer(Te,De,me,ue,xe,Ye,me,ue,O.COLOR_BUFFER_BIT,O.NEAREST):Qe?O.copyTexSubImage3D(pe,de,xe,Ye,vt+ot,Te,De,me,ue):O.copyTexSubImage2D(pe,de,xe,Ye,Te,De,me,ue);M.bindFramebuffer(O.READ_FRAMEBUFFER,null),M.bindFramebuffer(O.DRAW_FRAMEBUFFER,null)}else Qe?R.isDataTexture||R.isData3DTexture?O.texSubImage3D(pe,de,xe,Ye,vt,me,ue,Se,et,It,st.data):I.isCompressedArrayTexture?O.compressedTexSubImage3D(pe,de,xe,Ye,vt,me,ue,Se,et,st.data):O.texSubImage3D(pe,de,xe,Ye,vt,me,ue,Se,et,It,st):R.isDataTexture?O.texSubImage2D(O.TEXTURE_2D,de,xe,Ye,me,ue,et,It,st.data):R.isCompressedTexture?O.compressedTexSubImage2D(O.TEXTURE_2D,de,xe,Ye,st.width,st.height,et,st.data):O.texSubImage2D(O.TEXTURE_2D,de,xe,Ye,me,ue,et,It,st);M.pixelStorei(O.UNPACK_ROW_LENGTH,Ft),M.pixelStorei(O.UNPACK_IMAGE_HEIGHT,We),M.pixelStorei(O.UNPACK_SKIP_PIXELS,jt),M.pixelStorei(O.UNPACK_SKIP_ROWS,vn),M.pixelStorei(O.UNPACK_SKIP_IMAGES,Nn),de===0&&I.generateMipmaps&&O.generateMipmap(pe),M.unbindTexture()},this.initRenderTarget=function(R){z.get(R).__webglFramebuffer===void 0&&K.setupRenderTarget(R)},this.initTexture=function(R){R.isCubeTexture?K.setTextureCube(R,0):R.isData3DTexture?K.setTexture3D(R,0):R.isDataArrayTexture||R.isCompressedArrayTexture?K.setTexture2DArray(R,0):K.setTexture2D(R,0),M.unbindTexture()},this.resetState=function(){G=0,H=0,X=null,M.reset(),he.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return us}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(n){this._outputColorSpace=n;let t=this.getContext();t.drawingBufferColorSpace=ct._getDrawingBufferColorSpace(n),t.unpackColorSpace=ct._getUnpackColorSpace()}};var Zv=120,jv=.6,zu=e=>{let n=Rs(pt.fog);return Rs(e).map((t,r)=>t/n[r])},ku=e=>`vec3(${e.map(n=>n.toFixed(4)).join(", ")})`,Qv=zu(pt.hazeSun),Jv=zu(pt.hazeShade),Wu=`
vec3 hazeTint( vec3 fogCol, vec3 dir ) {
  float toSun = dot( dir, hazeSunDir ) * 0.5 + 0.5;
  return fogCol * mix( ${ku(Jv)}, ${ku(Qv)}, toSun * toSun );
}
`,Xu="uniform vec3 hazeSunDir;",eS=`
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogRay;
#endif
`,tS=`
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  // From the camera to here, in world directions (the view's rotation undone).
  vFogRay = ( vec4( mvPosition.xyz, 0.0 ) * viewMatrix ).xyz;
#endif
`;function nS(){return`
#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying vec3 vFogRay;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
  ${Xu}
  ${Wu}
#endif
`}var rS=`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float hazeDensity = fogDensity;
  #else
    float hazeDensity = fogNear;
    #ifdef READABLE
      hazeDensity = min( hazeDensity, fogFar );
    #endif
  #endif
  float hazeDist = length( vFogRay );
  vec3 hazeDir = vFogRay / max( hazeDist, 1e-3 );
  float hazeY = max( 0.0, cameraPosition.y + 0.5 * vFogRay.y );
  float hazeThin = 1.0 - ${jv.toFixed(3)} * ( 1.0 - exp2( - hazeY / ${Zv.toFixed(1)} ) );
  float hazeD = hazeDensity * hazeThin * hazeDist;
  float fogFactor = 1.0 - exp( - hazeD * hazeD );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, hazeTint( fogColor, hazeDir ), fogFactor );
#endif
`,xi=null;function P1(e){if(!xi){xi=e.clone().normalize(),Pe.fog_pars_vertex=eS,Pe.fog_vertex=tS,Pe.fog_pars_fragment=nS(),Pe.fog_fragment=rS;for(let n of[...Object.values(nn??{}).map(t=>t?.uniforms),ce?.fog])n?.fogColor&&(n.hazeSunDir={value:xi.clone()})}}var L1=()=>xi;function D1(){return`${Xu}
${Wu}`}var U1=e=>({value:e.clone().normalize()}),I1=.5,Eo=1,Ws=new Set;function N1(e){Eo=e;for(let n of Ws){let t=n.deref();t?t.setHaze(t.times,t.readable):Ws.delete(n)}}var Vu=class e extends ps{constructor(n,t){super(n,t*Eo,t*Eo),this.isHazeFog=!0,this.fair=t,this.times=1,this.readable=1,Ws.add(new WeakRef(this))}setHaze(n,t=1){this.times=n,this.readable=t,this.near=this.fair*n*Eo,this.far=this.fair*Math.min(n,t)*Eo}get density(){return this.near}clone(){return new e(this.color,this.fair)}};var rn=["standard","medium","high","ultra"],Nt={standard:"Very low",medium:"Low",high:"Standard",ultra:"Medium"},oS={standard:"Standard",medium:"Medium",high:"High",ultra:"Ultra"};function F1(e,n){let t=e?.setting??e?.level;return n||!rn.includes(t)?"":`The graphics settings have new names - your ${oS[t]} is now called ${Nt[t]}, the same picture. Very low, Low, Standard and Medium today; a new High and Ultra come later.`}var iS="medium",Xs=rn.at(-1),ir=e=>rn.indexOf(e),Gr=(e,n)=>ir(e)>ir(n),Br=e=>rn.includes(e);function kn(e={}){let n=e&&typeof e=="object"?e:{},t=n.level==="standard"?"standard":n.level===void 0?null:"medium",r=Br(n.highest)?n.highest:Xs,o=Br(n.setting)?n.setting:t??iS;return Gr(o,r)&&(o=r),{setting:o,highest:r,fixed:n.fixed===!0||n.valve===!1}}function Mo(e,{setting:n,highest:t,fixed:r}){let o={...e&&typeof e=="object"?e:{},setting:n,highest:t===Xs?null:t,fixed:!!r};return o.level=n==="standard"?"standard":"high",o}function To(e,n){let t=kn(e);return Br(n)?Mo(e,{...t,setting:n,highest:Gr(n,t.highest)?n:t.highest}):Mo(e,t)}function H1(e,n){let t=kn(e);return Br(n)?Mo(e,{...t,highest:n,setting:Gr(t.setting,n)?n:t.setting}):Mo(e,t)}function B1(e,n){return Mo(e,{...kn(e),fixed:!!n})}function $u(e,n=Xs){let t=ir(e);return t<0||t>=ir(n)?rn[0]:rn[t+1]}function Ku(e,n){let t=o=>o.first?100:o.of==="effects"?99:o.of==="picture"?-1:ir(o.of),r=o=>o.of==="picture"||o.of==="effects"||o.of!=="standard"&&Br(o.of)&&!Gr(o.of,e);return n.filter(r).sort((o,i)=>t(i)-t(o)||o.order-i.order)}function G1({built:e,steps:n=[],shed:t=0,scale:r=1}){let o=aS({built:e,steps:n,shed:t}),i=n.slice(0,t).some(s=>s.of===o),a=`${Nt[e]??e}${o!==e?` \u2192 ${Nt[o]}`:""}${i?" (reduced)":""}`;return r<1?`${a}, picture ${Math.round(r*100)}%`:a}function aS({built:e,steps:n=[],shed:t=0}){let r=n.slice(0,t),o=e;for(;Gr(o,"medium");){let i=n.filter(a=>a.of===o);if(!i.length||!i.every(a=>r.includes(a)))break;o=rn[ir(o)-1]}return o}function k1(e,n){return e.filter(t=>t.of!=="picture"&&Gr(t.of,n)).length}function V1(e,n){if(!Number.isInteger(n)||n<1||n>e.length)return null;let t=e[n-1];if(t.of==="picture"||!Br(t.of)||e.filter(i=>i.of===t.of).at(-1)!==t)return null;let o=rn[ir(t.of)-1];return o&&o!=="standard"?{upper:t.of,lower:o}:null}function z1({upper:e,lower:n}){return`The graphics keep switching between ${Nt[e]} and ${Nt[n]} on this PC. Make ${Nt[n]} the highest setting?`}function W1({built:e,fixed:n=!1,spent:t=!0,next:r="standard"}){return n?"slow picture":e==="standard"||!t?"":r==="standard"?`G for ${Nt.standard}`:`${Nt.standard} in the menu`}function X1({upper:e,lower:n}){return`Kept switching ${Nt[e]} \u2194 ${Nt[n]}: ${Nt[n]} as the highest setting would suit this PC`}var sS=1800*1e3;function Yu(e,n=null,t=Date.now(),r=""){let o=e??{},i="",a=new URLSearchParams(r).get("graphics");if(rn.includes(a))o=To(o,a),i=`Started on ${Nt[a]} graphics - G changes it`;else{let l=kn(o),c=n&&typeof n=="object"&&n.setting===l.setting&&Number.isFinite(n.at)&&t-n.at>=0&&t-n.at<sS,f=rn[rn.indexOf(l.setting)-1];c&&f&&(o={...To(o,f),highest:o?.highest??null},i=`${Nt[l.setting]} didn't finish starting last time on this PC - started on ${Nt[f]}. G to try ${Nt[l.setting]} again`)}let s=kn(o).setting;return{graphics:o,setting:s,changed:o!==e,note:{setting:s,at:t},message:i}}var bo=Yu(Gt("graphics",{}),Gt("startGuard",null),Date.now(),typeof location>"u"?"":location.search);bo.changed&&ao("graphics",bo.graphics);ao("startGuard",bo.note);if(typeof location<"u"&&/[?&]graphics=/.test(location.search)){let e=new URL(location.href);e.searchParams.delete("graphics"),history.replaceState(history.state,"",e)}var Q1=bo.message;function J1(){ao("startGuard",null)}var ft=bo.setting,Ce=ft!=="standard",wt=ft==="high"||ft==="ultra",At=ft==="ultra",Ot=typeof window<"u"&&!!window.pocket;function lS(){return kn(Gt("graphics",{}))}function eA(){let e=lS();return $u(e.setting,e.highest)}function tA(e){ao("graphics",To(Gt("graphics",{}),e)),location.reload()}var Ei={ultra:300,high:300,medium:220,standard:150,least:100},Zu=20,cS=.6;function ju(e,n=cS){return Object.fromEntries(Object.entries(e).map(([t,r])=>[t,typeof r=="number"?Math.round(r*n):r]))}var $s={ultra:120,high:45},fS=10,Qu={ultra:120,high:140},Ju={ultra:40,high:36},ed={ultra:!0},td={ultra:!0,high:!0},qu={bin:25,band:12};function uS(e,n,{bin:t=qu.bin,band:r=qu.band}={}){let o=new Uint8Array(e.length);if(!n?.length||!e.length)return o;let i=e.map(([l,c])=>{let f={d:1/0,s:0,side:1},u=0;for(let d=0;d<Math.max(1,n.length-1);d++){let[h,_]=n[d],[T,p]=n[d+1]??n[d],m=T-h,v=p-_,x=Math.hypot(m,v),g=x>0?Math.max(0,Math.min(1,((l-h)*m+(c-_)*v)/(x*x))):0,E=h+m*g,b=_+v*g,w=Math.hypot(l-E,c-b);w<f.d&&(f={d:w,s:u+x*g,side:m*(c-_)-v*(l-h)>=0?1:-1}),u+=x}return f}),a=new Map,s=(l,c)=>`${l}:${c}`;for(let l of i){let c=s(l.side,Math.floor(l.s/t));a.set(c,Math.min(a.get(c)??1/0,l.d))}return i.forEach((l,c)=>{let f=Math.floor(l.s/t),u=1/0;for(let d of[f-1,f,f+1])u=Math.min(u,a.get(s(l.side,d))??1/0);l.d<=u+r&&(o[c]=1)}),o}var dS=19;function nd(e,[n,t],r,{distance:o=$s.high,give:i=fS,front:a=null,frontDistance:s=0,max:l=1/0,always:c=null,ahead:f=null,behind:u=dS}={}){let d=f?.dir?Math.hypot(f.dir[0],f.dir[1]):0,[h,_]=d>1e-6?[f.dir[0]/d,f.dir[1]/d]:[0,0],T=[],p=e.length/2,m=new Uint8Array(p),v=[];for(let x=0;x<p;x++){if(c?.[x]){m[x]=1;continue}let g=Math.hypot(e[x*2]-n,e[x*2+1]-t),E=r[x]===1;if(d>1e-6){let S=(e[x*2]-n)*h+(e[x*2+1]-t)*_;if(E?S<-u-i/2:S<-u+i/2)continue}let b=a?.[x]?Math.max(o,s):o;b>0&&(E?g<=b+i/2:g<b-i/2)&&(m[x]=1,b>o&&!(E?g<=o+i/2:g<o-i/2)&&v.push([g,x]))}if(v.length>l){v.sort((x,g)=>x[0]-g[0]);for(let[,x]of v.slice(Math.max(0,l)))m[x]=0}for(let x=0;x<p;x++)r[x]===1!=(m[x]===1)&&(r[x]=m[x],T.push(x));return T}function Ks(e,{far:n=!1,close:t=!1,boughs:r=!0}={},{nearOnly:o=!1,plain:i=!1,worn:a=!1}={}){return e==="far"?n:n?!1:e==="limbs"||e==="cardsClose"||e==="core"?t:i?!t&&!r:a?e==="cards"?!t&&r:t||r:e==="cards"||o?!t:!0}var Tn={on:{high:!0},sides:6,toward:1,spread:60,reach:3,least:14,cover:.8,near:40,give:10};function rd(e,{facing:n=null,sides:t=Tn.sides,toward:r=Tn.toward,spread:o=Tn.spread,reach:i=Tn.reach,least:a=Tn.least,cover:s=Tn.cover}={}){let l=e.length/4,c=new Uint8Array(l),f=a;for(let v=0;v<l;v++)f=Math.max(f,e[v*4+3]*i);let u=f,d=new Map,h=(v,x)=>v*73856093+x*19349663;for(let v=0;v<l;v++){let x=h(Math.floor(e[v*4]/u),Math.floor(e[v*4+1]/u));d.has(x)?d.get(x).push(v):d.set(x,[v])}let _=n?.length?n:null,T=o*Math.PI/180,p=_?r:t,m=_?uS(Array.from({length:l},(v,x)=>[e[x*4],e[x*4+1]]),_):null;for(let v=0;v<l;v++){if(m?.[v])continue;let[x,g,E,b]=[e[v*4],e[v*4+1],e[v*4+2],e[v*4+3]],w=Math.max(a,b*i),S=_?hS(x,g,_):null,A=S?Math.atan2(S[1]-g,S[0]-x):0;if(S&&Math.hypot(S[0]-x,S[1]-g)<1e-6)continue;let C=new Uint8Array(p),P=0,D=Math.floor(x/u),U=Math.floor(g/u);for(let L=D-1;L<=D+1&&P<p;L++)for(let F=U-1;F<=U+1&&P<p;F++)for(let G of d.get(h(L,F))??[]){if(G===v||e[G*4+2]<E*s)continue;let H=e[G*4]-x,X=e[G*4+1]-g,$=Math.hypot(H,X);if($>w||$===0)continue;let j;if(_){let Z=Math.atan2(Math.sin(Math.atan2(X,H)-A),Math.cos(Math.atan2(X,H)-A));if(Math.abs(Z)>T)continue;j=Math.min(p-1,Math.floor((Z+T)/(2*T)*p))}else j=Math.floor((Math.atan2(X,H)+Math.PI)/(Math.PI*2)*t)%t;C[j]||(C[j]=1,P++)}P===p&&(c[v]=1)}return c}function hS(e,n,t){let r=null,o=1/0;for(let i=0;i<t.length;i++){let[a,s]=t[i],[l,c]=t[i+1]??t[i],f=l-a,u=c-s,d=f*f+u*u,h=d>0?Math.max(0,Math.min(1,((e-a)*f+(n-s)*u)/d)):0,_=a+f*h,T=s+u*h,p=(e-_)**2+(n-T)**2;p<o&&([r,o]=[[_,T],p])}return r}function od(e,n,t,r,{near:o=Tn.near,give:i=Tn.give}={}){let a=[];n=(n??[]).filter(l=>l?.length);let s=e.length/2;for(let l=0;l<s;l++){if(!t[l])continue;let c=1/0;for(let d of n)c=Math.min(c,id(e[l*2],e[l*2+1],d));let f=r[l]===1,u=f?c<=o+i/2:c<o-i/2;u!==f&&(r[l]=u?1:0,a.push(l))}return a}function id(e,n,t){let r=1/0;for(let o=0;o<t.length;o++){let[i,a]=t[o],s=t[o+1],l;if(!s)l=(e-i)**2+(n-a)**2;else{let[c,f]=s,u=c-i,d=f-a,h=u*u+d*d,_=h>0?Math.max(0,Math.min(1,((e-i)*u+(n-a)*d)/h)):0;l=(e-i-u*_)**2+(n-a-d*_)**2}l<r&&(r=l)}return Math.sqrt(r)}function ad(e,n,t,{distance:r=Ei.medium,hysteresis:o=Zu,never:i=null}={}){let a=[];if(n=(n??[]).filter(f=>f?.length),!n.length)return a;let s=r+o/2,l=r-o/2,c=e.length/2;for(let f=0;f<c;f++){let u=t[f]===1,d=!1;if(!i?.[f]){let h=1/0;for(let _ of n)h=Math.min(h,id(e[f*2],e[f*2+1],_));d=u?h>=l:h>s}d!==u&&(t[f]=d?1:0,a.push(f))}return a}function sd(e,n,t,r,{distance:o=Ei.medium,hysteresis:i=Zu}={}){let a=o-i,s=a*a,l=e.length/2;for(let c=0;c<l;c++){if(n[c]!==1)continue;let f=e[c*2]-t,u=e[c*2+1]-r;if(f*f+u*u<s)return!0}return!1}function ld({cut:e=!1,newPlan:n=!1,tooClose:t=!1}={}){return e||n||t}function Ys(e,n){return n?.length?Array.isArray(n[0]?.[0])?[[e],...n]:[[e],n]:[[e]]}var qs={bark:{full:14,fade:28,depth:.05,cracks:.55,lean:1.3},leaves:{full:45,fade:72,through:.08,behind:.05,glint:.04,shade:.4}};var kr=[{id:"grade",label:"Warm colour and vignette",cost:"light",help:"A slightly warmer colour over the whole picture with a little more contrast, and the corners a touch darker, as a camera sees it."},{id:"ao",label:"Ambient occlusion",cost:"heavy",step:"ambient occlusion",heavy:!0,help:"A soft shade where things meet the ground near you - the foot of a trunk, under a bunker's lip, along a wall - so they sit in it rather than float."},{id:"fxaa",label:"Smooth edges (FXAA)",cost:"light",help:"Smooths the jagged edges the picture's own smoothing misses: leaves, grass blades, thin flag poles."},{id:"sharpen",label:"Sharper picture",cost:"light",costWhen:"with any other of the picture's effects on",help:"The picture's fine detail - grass blades, leaves, the far tree line - brought back where smoothing softens it, most on the highest setting, whose picture is built up over time. Edges that are sharp already are left alone, and so is the sky."},{id:"bloom",label:"Bloom",cost:"some",step:"bloom",heavy:!0,help:"A soft glow round only the very brightest things - sun on water, the white of the ball in sunlight. Held back: nothing else glows."},{id:"sky",label:"Detailed sky",cost:"light",help:"High, thin wisps of cloud across the sky above the cumulus, and the full number of clouds. Off: a plain sky with fewer clouds."},{id:"haze",label:"Distance haze",cost:"none",help:"The air's haze, so far hills and woods fade into the sky. Off: a clearer day, the haze only right at the edge of the world."},{id:"textures",label:"Sharp ground textures",cost:"some",costWhen:"and more of the graphics card's memory",reload:!0,notOn:["standard"],help:"Grass blades and sand grains you can see on the ground near the ball, as Standard has, on Low too. A\xB2 Golf reloads to change it."},{id:"dof",label:"Blur the far distance",cost:"some",step:"the far blur",heavy:!0,help:"The far hills and woods, beyond any green, softly out of focus, as a camera focused on the hole sees them."},{id:"shafts",label:"Sun shafts and glow",cost:"heavy",costWhen:"when the sun's in the picture",step:"sun shafts",heavy:!0,notOn:["standard","medium","high"],help:"On Medium (the highest setting): rays of sunlight streaming through the leaves and round the trunks when the sun's in the picture, and a wider, softer glow round the sun's glints on water."},{id:"focus",label:"Flyover depth of field",cost:"heavy",costWhen:"only in a hole's flyover - nothing while you play",step:"flyover depth of field",heavy:!0,notOn:["standard","medium","high"],help:"On Medium (the highest setting): in a hole's flyover the camera focuses on the ball, as a film camera's would: the ball, the trees along the hole and the green ahead stay sharp, and only the grass right by the camera and the far distance go softly out of focus. Never while you're playing a shot."},{id:"taa",label:"Smooth edges over time (TAA)",cost:"some",costWhen:"in place of FXAA's",step:"smoothing over time",notOn:["standard","medium","high"],help:"On Medium (the highest setting): each frame's drawn a fraction of a pixel to one side and blended with the last few, so leaves, flag poles and far mowing stripes are smooth and never crawl. In place of FXAA while it's on."},{id:"upscale",label:"Fewer pixels, built up over time",cost:"saves",costWhen:"with Smooth edges over time on",notOn:["standard","medium","high"],help:"On Medium (the highest setting), with Smooth edges over time: the picture drawn at two-thirds of its size each way and the full-size one built up from the last few frames, each nudged a fraction of a pixel - nearly as sharp, at under half the drawing. Off: every pixel drawn every frame."},{id:"sway",label:"Camera sway",cost:"none",help:"The camera breathes very slightly, as if held, rather than standing dead still. It never moves the aim line enough to see."},{id:"evening",label:"Late-afternoon light",cost:"none",reload:!0,help:"A lower, warmer sun on the practice greens and in the Challenges: golden light, longer shadows, a warmer sky (a round and the range take their own Time of day, picked with the sky). Off: the sun higher, in the middle of the day. A\xB2 Golf reloads to change it."},{id:"hardsun",label:"Harder sunlight",cost:"none",reload:!0,help:"The sun stronger and the sky's light softer, as on a clear day: shade under a third as bright as the sun rather than half, so trees, slopes and bunker faces stand out (less so as the sun gets low, so an evening round isn't dark). Off: the softer, flatter light the game had. A\xB2 Golf reloads to change it."},{id:"grassfield",label:"Grass all over the hole",cost:"heavy",costWhen:"and a longer wait while each hole's built",reload:!0,notOn:["standard"],help:"Tufts of longer grass all over every hole's rough and long grass, as thick far out as by the ball, see-through round the ball so you can always find it. Off: tufts only by the tee and round the green. A\xB2 Golf reloads to change it."},{id:"fineleaves",label:"Finer leaves",cost:"some",costWhen:"with trees near you, and a moment longer to start",reload:!0,notOn:["standard","medium"],help:"On Standard and Medium: the trees near you drawn with more, smaller leaves - their crowns, boughs and pine sprays - so a tree close by reads as leaves, not as cards of them. Off: fewer, larger cards, as before. A\xB2 Golf reloads to change it."},{id:"leafshare",label:"Fewer leaves on far trees",cost:"spares",costWhen:"the more trees there are down the hole",notOn:["standard","medium"],help:"On Standard and Medium: a tree well down the hole is drawn with a share of its leaves - all of them within 60 m, a third by 250 m - each a little bigger, so it's as full as ever for far fewer triangles (most on Medium, where every tree of the hole is drawn at its best). Its leaves fill in a few at a time as the camera comes to it, each from nothing: no tree is swapped for another. Off: every leaf of every tree, however far."},{id:"clock",label:"Time of day from the clock",cost:"none",reload:!0,help:"The sun where it would be at this time of day on the practice greens and in the Challenges: low and soft in the morning, high at midday, low and golden in the evening (a round and the range take their own Time of day, picked with the sky). In place of Late-afternoon light while it's on. A\xB2 Golf reloads to change it."},{id:"seasons",label:"Seasons",cost:"none",reload:!0,help:"The course in today's season: fresher, lighter greens in spring, the usual deep green in summer, golds, coppers and reds in the broadleaves in autumn, duller grass and dead brown leaves in winter. A\xB2 Golf reloads to change it."},{id:"rainground",label:"Rain on the ground",cost:"some",costWhen:"only while it rains",notOn:["standard"],help:"While it rains, drops splashing on the grass all round you, and rings spreading on the puddles. (Ponds ring in the rain either way.)"},{id:"wetshine",label:"Reflections on wet ground",cost:"light",costWhen:"only after rain",reload:!0,notOn:["standard"],help:"After rain the grass and paths shine with the sky's light, most where you look along them. A\xB2 Golf reloads to change it."}],Zs=kr.map(e=>e.id),oA=Object.fromEntries(kr.filter(e=>e.step).map(e=>[e.id,e.step])),pS={saves:"less than nothing: it saves more than half the picture's drawing",spares:"less than nothing: it spares a third or more of the trees' leaves from being drawn",none:"next to nothing (only the colours or the light change)",light:"light, about 1 to 3% of each frame",some:"some, about 4 to 8% of each frame",heavy:"heavy, about 10 to 20% of each frame"};function iA(e,n=[]){let t=kr.find(i=>i.id===e);if(!t?.cost)return"";let r=`Typical cost: ${pS[t.cost]}${t.costWhen?`, ${t.costWhen}`:""}.`,o=t.step?mS(n,t.step):null;return o?`${r} Measured here: ${o.ms} ms a frame (${Math.round(o.share*100)}%) at Medium's slowest moment (the highest setting).`:r}function mS(e,n){for(let t of Array.isArray(e)?e:[])for(let r of t?.results??[]){let o=r?.costs?.find(i=>i.name===n);if(o&&Number.isFinite(o.ms))return o}return null}var cd=Object.fromEntries(kr.map(e=>[e.id,e])),fd=typeof globalThis<"u"&&!!globalThis.pocket,gS=["textures","grassfield","fineleaves","wetshine"],js=["default","performance"],aA={default:"Default",performance:"Performance",custom:"Your own"};function Qs(e,n=fd){return Object.fromEntries(kr.map(t=>[t.id,e==="performance"?!t.heavy&&!(n&&gS.includes(t.id)):!0]))}var _S=(e,n=fd)=>n||e==="standard"?"performance":"default";function ud(e,n=null){let t=Zs.filter(r=>!n||dd(r,n));return js.find(r=>t.every(o=>!!e[o]===Qs(r)[o]))??"custom"}function Js(e,n="medium"){let t=e&&typeof e=="object"?e:{},r=Qs(js.includes(t.preset)?t.preset:_S(n)),o=t.on&&typeof t.on=="object"?t.on:{},i=Object.fromEntries(Zs.map(a=>[a,typeof o[a]=="boolean"?o[a]:r[a]]));return{on:i,preset:ud(i,n)}}var Mi=(e,n=null)=>({on:{...e},preset:ud(e,n)});function sA(e,n,t,r){let{on:o}=Js(e,r);return n in cd?Mi({...o,[n]:!!t},r):Mi(o,r)}function lA(e,n,t){return js.includes(n)?Mi(Qs(n),t):Mi(Js(e,t).on,t)}function cA(e,n){return kr.some(t=>t.reload&&!!e?.[t.id]!=!!n?.[t.id])}var dd=(e,n)=>!(cd[e]?.notOn??[]).includes(n);function Pn(e,n){let{on:t}=Js(e,n);return Object.fromEntries(Zs.map(r=>[r,t[r]&&dd(r,n)]))}var vS=["grade","ao","fxaa","bloom","dof","shafts","focus","taa"],fA=e=>vS.some(n=>e?.[n]);var md="cs2",tl=2600,nl=64;function SS(e=nl,n=8,t=11){let r=t,o=()=>(r=r*16807%2147483647)/2147483647,i=Array.from({length:n*n},o),a=(c,f)=>i[(f+n)%n*n+(c+n)%n],s=new Uint8Array(e*e),l=c=>c*c*(3-2*c);for(let c=0;c<e;c++)for(let f=0;f<e;f++){let u=f/e*n,d=c/e*n,h=Math.floor(u),_=Math.floor(d),T=l(u-h),p=l(d-_),m=a(h,_)+(a(h+1,_)-a(h,_))*T,v=a(h,_+1)+(a(h+1,_+1)-a(h,_+1))*T;s[c*e+f]=Math.round((m+(v-m)*p)*255)}return s}function xS(){let e=new Gn(SS(),nl,nl,ei,Kt);return e.wrapS=e.wrapT=fn,e.magFilter=St,e.minFilter=$t,e.generateMipmaps=!0,e.needsUpdate=!0,e}var el=su({hard:Pn(Gt("effects",{}),ft).hardsun}),ES=el.sun*Math.sin(As*Math.PI/180)/(el.sun*Math.sin(As*Math.PI/180)+el.sky),Ti={csMap:{value:xS()},csDrift:{value:new je},csStrength:{value:0},csLo:{value:.5}},hd=`
uniform sampler2D csMap;
uniform vec2 csDrift;
uniform float csStrength;
uniform float csLo;
`,pd=`
if ( csStrength > 0.0 ) {
  float csN = texture2D( csMap, ( csWorld.xz - csDrift ) / ${tl.toFixed(1)} ).r;
  float csShade = smoothstep( csLo, csLo + 0.2, csN ) * min( 0.95, csStrength / ${ES.toFixed(4)} );
  reflectedLight.directDiffuse *= 1.0 - csShade;
  reflectedLight.directSpecular *= 1.0 - csShade;
}
`,gd=new Set;function gA(e){return gd.add(e),e}function _A(e,[n,t],r){let o=Ti.csDrift.value;o.x=(o.x+n*e)%tl,o.y=(o.y+t*e)%tl,Ti.csStrength.value=r;for(let i of gd)i(Ti)}function _d(e){return Object.assign(e.uniforms,Ti),!pd&&!hd||(e.vertexShader=e.vertexShader.replace("#include <common>",`#include <common>
varying vec3 csWorld;`).replace("#include <project_vertex>",`#include <project_vertex>
csWorld = (vec4(mvPosition.xyz, 0.0) * viewMatrix).xyz + cameraPosition;`),e.fragmentShader=e.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 csWorld;
${hd}`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
${pd}`)),e}function vd(e,n=!1){return n||!(e>0)?0:Math.min(1,e/28)}var bi=[],Ln=[],Vn=0;function dn(e,n,t,{of:r="medium",first:o=!1}={}){let i=bi.findIndex(a=>a.name===n);i>=0&&bi.splice(i,1),bi.push({order:e,name:n,apply:t,of:r,first:o}),Ln=Ku(ft,bi)}function MS(){return Ln.length}function MA(){return Ln.map(({name:e,of:n,order:t,first:r})=>({name:e,of:n,order:t,first:r}))}function TA(){return Vn}function bA(){return Ln.slice(0,Vn).map(e=>e.name)}function wA(e){for(e=Math.max(0,Math.min(MS(),e));Vn<e;)Ln[Vn++].apply(!0);for(;Vn>e;)Ln[--Vn].apply(!1)}function rl(e){return Ln.slice(0,Vn).some(n=>n.name===e)}function AA(e,n){let t=Ln.findIndex(r=>r.name===e);return t<0||t<Vn?!1:(Ln[t].apply(!!n),!0)}var Ed="b1",Md={bendTime:{value:0},bendDir:{value:new je(1,0)},bendStrength:{value:0},bendSpeed:{value:2},bendFlutter:{value:Ce?1:0}},Vr=e=>Number.isInteger(e)?`${e}.0`:`${e}`,RS=`
uniform float bendTime;
uniform vec2 bendDir;
uniform float bendStrength;
uniform float bendSpeed;
uniform float bendFlutter;
float bendHash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}
float bendWave(vec3 foot, float rate) {
  float along = dot(foot.xz, bendDir);
  float k = 6.2831853 / ${Vr(160)};
  float gust = 0.85 + 0.15 * sin(along * k - bendTime * k * bendSpeed);
  float swing = sin(bendTime * rate - along * 0.09 + bendHash(floor(foot.xz * 2.0)) * 6.2831853);
  return bendStrength * gust * (${Vr(.55)} + ${Vr(1-.55)} * swing);
}
`,Td=`
  #if defined( USE_BATCHING )
    mat4 bM = modelMatrix * batchingMatrix;
  #elif defined( USE_INSTANCING )
    mat4 bM = modelMatrix * instanceMatrix;
  #else
    mat4 bM = modelMatrix;
  #endif`,wi=(e="")=>`
{
  ${Td}
  vec3 bFoot = (bM * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float bH = length(bM[1].xyz) * ${Vr(10)};
  float bY = max(0.0, (bM * vec4(transformed, 1.0)).y - bFoot.y);
  float bT = clamp(bY / bH, 0.0, 1.0);
  vec3 bPush = vec3(bendDir.x, 0.0, bendDir.y) * (bendWave(bFoot, 1.25) * ${Vr(.02)} * bH * bT * bT);
  ${e}
  transformed += inverse(mat3(bM)) * bPush;
}
`,yS=`
  float bF = bendHash(transformed.xz * 3.7 + transformed.y);
  bPush += vec3(sin(bendTime * 7.0 + bF * 6.2831853), 0.6 * sin(bendTime * 5.3 + bF * 12.0), cos(bendTime * 6.1 + bF * 9.0)) * (0.05 * bendStrength * bendFlutter);
`,CS=`
  float bHang = clamp(1.0 - bY / (bH * 0.6), 0.0, 1.0);
  bPush += vec3(bendDir.x, 0.0, bendDir.y) * (bendStrength * bHang * 0.35 * (0.6 + 0.4 * sin(bendTime * 1.7 + bendHash(bFoot.xz) * 6.2831853)));
`,xd=`
{
  ${Td}
  vec3 bFoot = (bM * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float bY = max(0.0, transformed.y) * length(bM[1].xyz);
  float bRipple = 1.0 + 0.25 * sin(bendTime * 4.3 + bendHash(bFoot.xz) * 6.2831853 + transformed.x * 3.0);
  vec3 bPush = vec3(bendDir.x, 0.0, bendDir.y) * (bendWave(bFoot, 2.1) * bRipple * ${Vr(.1)} * bY * bY);
  transformed += inverse(mat3(bM)) * bPush;
}
`,ol={trunk:wi(),crown:wi(),cards:wi(yS),strands:wi(CS),tuft:xd,dressing:xd};function bd(e,n){let t=ol[n]??"";return t&&(Object.assign(e.uniforms,Md),e.vertexShader=e.vertexShader.replace("#include <common>",`#include <common>
${RS}`).replace("#include <begin_vertex>",`#include <begin_vertex>
${t}`)),e}var wd=!1;dn(4,"leaf flutter",e=>{wd=e});var Ad=new Set;function LA(e){return Ad.add(e),e}function DA(e){let n=Md;n.bendTime.value=e.time,n.bendDir.value.set(e.dir[0],e.dir[1]),n.bendStrength.value=vd(e.gusting,e.still),n.bendSpeed.value=Math.max(2,(e.mph??0)*.447),n.bendFlutter.value=Ce&&!wd?1:0;for(let t of Ad)t(n);return n}var Rd={trunk:{near:2,far:5,least:.25},leaves:{near:.5,far:1.5,least:0}};var PS=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];var zr=e=>Number.isInteger(e)?`${e}.0`:`${e}`;function yd(e){return`{
    float stD = length(vViewPosition);
    if (stD < ${zr(e.far)}) {
      float stT = clamp((stD - ${zr(e.near)}) / ${zr(e.far-e.near)}, 0.0, 1.0);
      float stCover = ${zr(e.least)} + ${zr(1-e.least)} * stT * stT * (3.0 - 2.0 * stT);
      const float stBayer[16] = float[16](${PS.map(zr).join(", ")});
      ivec2 stP = ivec2(gl_FragCoord.xy) & 3;
      if (stCover <= (stBayer[stP.y * 4 + stP.x] + 0.5) / 16.0) discard;
    }
  }`}var LS={amount:.1,size:7,warm:[1.1,1,.6],spread:[.45,1.55],sizes:[.7,1.4]},Cd="tp2",DS=new Set(["crown","cards","strands"]),hn=e=>Number.isInteger(e)?`${e}.0`:`${e}`,US=`
  #if defined( USE_BATCHING )
    mat4 pM = modelMatrix * getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
  #elif defined( USE_INSTANCING )
    mat4 pM = modelMatrix * instanceMatrix;
  #else
    mat4 pM = modelMatrix;
  #endif`,IS="sin(p.x * k + s * 6.2832) * sin(p.y * k * 0.8 + s * 11.0) * sin(p.z * k + s * 17.0)",Ai={amount:[7.13,.37],size:[3.71,.61]};function Pd(e,n){if(!DS.has(n)||!ol[n])return e;let t=LS;return e.vertexShader=e.vertexShader.replace("#include <project_vertex>",`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
    {
      ${US}
      vec3 pFoot = (pM * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      float s = fract(sin(dot(floor(pFoot.xz * 4.0), vec2(12.9898, 78.233))) * 43758.5453);
      vec3 p = position;
      float pA = fract(s * ${hn(Ai.amount[0])} + ${hn(Ai.amount[1])});
      float pS = fract(s * ${hn(Ai.size[0])} + ${hn(Ai.size[1])});
      float k = ${hn(2*Math.PI/t.size)} / mix(${hn(t.sizes[0])}, ${hn(t.sizes[1])}, pS);
      float pv = ${IS};
      vColor.rgb *= vec3(1.0) + ${hn(t.amount)} * mix(${hn(t.spread[0])}, ${hn(t.spread[1])}, pA) * pv * vec3(${t.warm.map(hn).join(", ")});
    }
    #endif
    #include <project_vertex>`),e}var wo={sheen:.45,power:4,tint:[1,.97,.84],body:.12},Ld=["ground","tuft","tuftnear","tuftfar","longgrass","nest"];var Dd="gl1",NS=new Set(Ld),OS=e=>NS.has(e),FS={glK:{value:new te(wo.sheen,wo.power,wo.body)},glTint:{value:new te(...wo.tint)}},BA={value:new te(0,1,0)},HS=`
uniform vec3 glK;
uniform vec3 glTint;
float glGrass = 1.0;
`,BS=`
#if NUM_DIR_LIGHTS > 0
if ( glK.x > 0.0 || glK.z > 0.0 ) {
  vec3 glL = directionalLights[ 0 ].direction;
  vec3 glV = normalize( vViewPosition );
  vec3 glUp = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
  float glGraze = 1.0 - max( dot( glUp, glV ), 0.0 );
  float glGlance = max( dot( reflect( -glL, glUp ), glV ), 0.0 );
  float glSheen = glK.x * pow( glGlance, glK.y ) * glGraze * glGraze;
  float glLevel = dot( glV, glL ) - dot( glV, glUp ) * dot( glL, glUp );
  float glSun = dot( reflectedLight.directDiffuse, vec3( 0.2126, 0.7152, 0.0722 ) );
  reflectedLight.directDiffuse = reflectedLight.directDiffuse * ( 1.0 + glK.z * glLevel * glGrass ) + glTint * ( glSun * glSheen * glGrass );
}
#endif
`;function Ud(e,n){return OS(n)&&(Object.assign(e.uniforms,FS),e.fragmentShader=e.fragmentShader.replace("#include <common>",`#include <common>
${HS}`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
${BS}`)),e}var zt={full:60,least:250,share:.3,fade:.06,step:2,give:1,reach:4},GS=e=>{let n=Math.min(1,Math.max(0,e));return n*n*(3-2*n)};function kS(e,n=zt){return 1-(1-n.share)*GS((e-n.full)/Math.max(1,n.least-n.full))}function Id(e,n,t=zt){let r=kS(Math.max(0,e-t.step-t.give),t);return Math.min(n,Math.floor((r+t.fade)*n)+2)}function Nd(e){let n=e.length;if(n<=2)return Array.from({length:n},(c,f)=>f);let t=[1/0,1/0,1/0],r=[-1/0,-1/0,-1/0];for(let c of e)for(let f=0;f<3;f++)t[f]=Math.min(t[f],c[f]),r[f]=Math.max(r[f],c[f]);let o=c=>{let f=c&1023;return f=(f|f<<16)&50331903,f=(f|f<<8)&50393103,f=(f|f<<4)&51130563,f=(f|f<<2)&153391689,f},i=e.map(c=>{let f=[0,1,2].map(u=>Math.min(1023,Math.floor((c[u]-t[u])/(r[u]-t[u]||1)*1024)));return o(f[0])+o(f[1])*2+o(f[2])*4}),a=Array.from({length:n},(c,f)=>f).sort((c,f)=>i[c]-i[f]||c-f),s=0;for(;1<<s<n;)s++;let l=[];for(let c=0;c<1<<s;c++){let f=0;for(let u=0;u<s;u++)c&1<<u&&(f|=1<<s-1-u);f<n&&l.push(a[f])}return l}function Od(e,n){let t=new Int32Array(n);for(let l=0;l<n;l++)t[l]=l;let r=l=>{for(;t[l]!==l;)t[l]=t[t[l]],l=t[l];return l},o=(l,c)=>{let f=r(l),u=r(c);f!==u&&(t[u]=f)};for(let l=0;l+2<e.length;l+=3)o(e[l],e[l+1]),o(e[l],e[l+2]);let i=new Int32Array(n).fill(-1),a=[];for(let l=0;l+2<e.length;l+=3){let c=r(e[l]);i[c]<0&&(i[c]=a.length,a.push([])),a[i[c]].push(l)}let s=new Int32Array(n);for(let l=0;l<n;l++)s[l]=i[r(l)];return{units:a.length,unitOf:s,triangles:a}}var Fd="ls1",il=e=>Number.isInteger(e)?`${e}.0`:`${e}`,yi={leafEye:{value:new te},leafShareK:{value:new Lt(zt.full,zt.least,zt.share,1)}},VS=`
attribute vec4 leafPart;
uniform vec3 leafEye;
uniform vec4 leafShareK;
`,zS=`
#if defined( USE_BATCHING )
if ( leafShareK.w > 0.5 ) {
  vec3 lsFoot = ( modelMatrix * batchingMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ) ).xyz;
  float lsT = clamp( ( distance( lsFoot.xz, leafEye.xz ) - leafShareK.x ) / max( leafShareK.y - leafShareK.x, 1.0 ), 0.0, 1.0 );
  float lsShare = 1.0 - ( 1.0 - leafShareK.z ) * lsT * lsT * ( 3.0 - 2.0 * lsT );
  float lsRank = clamp( ( leafPart.w - lsShare ) / ${il(zt.fade)}, 0.0, 1.0 );
  float lsKeep = 1.0 - lsRank * lsRank * ( 3.0 - 2.0 * lsRank );
  float lsGrow = inversesqrt( min( 1.0, lsShare + ${il(zt.fade/2)} ) );
  transformed += leafPart.xyz * ( ${il(zt.reach)} * ( lsGrow * lsKeep - 1.0 ) );
}
#endif
`;function Hd(e,n){return n!=="cards"||(Object.assign(e.uniforms,yi),e.vertexShader=e.vertexShader.replace("#include <common>",`#include <common>
${VS}`).replace("#include <begin_vertex>",`#include <begin_vertex>
${zS}`)),e}var Ri=!0,al=1;function zA(e){Ri!==!!e&&(Ri=!!e,yi.leafShareK.value.w=Ri?1:0,al++)}function Bd(e){e?.position&&yi.leafEye.value.copy(e.position)}function sl(e){let n=e?.index,t=e?.attributes?.position;if(!n||!t||!n.count||e.userData.leafEnds)return e;let r=t.count,o=n.array,{units:i,unitOf:a,triangles:s}=Od(o,r),l=new Float64Array(i*3),c=new Uint32Array(i);for(let v=0;v<r;v++){let x=a[v];x<0||(l[x*3]+=t.getX(v),l[x*3+1]+=t.getY(v),l[x*3+2]+=t.getZ(v),c[x]++)}let f=Array.from({length:i},(v,x)=>[l[x*3]/c[x],l[x*3+1]/c[x],l[x*3+2]/c[x]]),u=Nd(f),d=new o.constructor(o.length),h=new Uint32Array(i+1),_=new Float32Array(i),T=0;u.forEach((v,x)=>{_[v]=x/i;for(let g of s[v])d[T++]=o[g],d[T++]=o[g+1],d[T++]=o[g+2];h[x+1]=T}),o.set(d),n.needsUpdate=!0;let p=new Int16Array(r*4),m=v=>Math.round(Math.max(-1,Math.min(1,v))*32767);for(let v=0;v<r;v++){let x=a[v];x<0||(p[v*4]=m((t.getX(v)-f[x][0])/zt.reach),p[v*4+1]=m((t.getY(v)-f[x][1])/zt.reach),p[v*4+2]=m((t.getZ(v)-f[x][2])/zt.reach),p[v*4+3]=m(_[x]))}return e.setAttribute("leafPart",new Ie(p,4,!0)),e.userData.leafEnds=h,e}function ll(e){let n=e?.attributes?.position?.count??0;return e&&e.attributes.leafPart?.count!==n&&e.setAttribute("leafPart",new Ie(new Int16Array(n*4),4,!0)),e}function Gd(e,n){if(!n.length||e.userData.leaves)return;let t=n.length,r=n.reduce((h,_)=>Math.max(h,_.id),0)+1,o=new Uint32Array(r),i=new Uint32Array(r),a=new Float32Array(t*3),s=new Uint32Array(t),l=n.map(h=>h.ends);n.forEach((h,_)=>{a.set([h.x,h.y,h.z],_*3),s[_]=h.id,o[h.id]=i[h.id]=h.ends[h.ends.length-1]});let c={trees:n,whole:o,sent:i,at:new te(1/0,0,0),stamp:0,shadow:!1,listed:!1,counted:0};e.userData.leaves=c;let f=(h,_)=>{let[T,p,m,v,x,g]=[h[0],h[2],h[4],h[6],h[8],h[10]],E=h[12]-_.x,b=h[14]-_.z;for(let w=0,S=0;w<t;w++,S+=3){let A=a[S],C=a[S+1],P=a[S+2],D=T*A+m*C+x*P+E,U=p*A+v*C+g*P+b,L=l[w];i[s[w]]=L[Id(Math.sqrt(D*D+U*U),L.length-1)]}c.counted++},u=e.onBeforeRender;e.onBeforeRender=function(h,_,T,p,m,...v){let x=this._visibilityChanged||this.perObjectFrustumCulled||this.sortObjects;if(u.call(this,h,_,T,p,m,...v),h?.isWebGPURenderer||m?.wireframe)return;x&&(c.listed=!1);let g=this._multiDrawCounts,E=this._indirectTexture?.image?.data;if(!g||!E)return;let b=Ri&&!c.shadow,w=!1;if(b){let A=yi.leafEye.value;if((c.stamp!==al||A.distanceToSquared(c.at)>zt.step*zt.step)&&(c.stamp=al,c.at.copy(A),f(this.matrixWorld.elements,A),w=!0),c.listed&&!w)return}else if(!c.listed)return;let S=b?i:o;for(let A=0,C=this._multiDrawCount;A<C;A++){let P=E[A];P<r&&o[P]&&(g[A]=S[P])}c.listed=b};let d=e.onBeforeShadow;e.onBeforeShadow=function(...h){c.shadow=!0;try{d.apply(this,h)}finally{c.shadow=!1}}}var Xd="/textures/",cl=["furrowed","plates","birch","plane"],Dn=Object.fromEntries(cl.map((e,n)=>[e,n])),fl=["asphalt","concrete","gravel","wood","brick"],$A=Object.fromEntries(fl.map((e,n)=>[e,n])),$d=[191,128,128,255];function kd(){let e=new Gn(new Uint8Array($d),1,1);return e.needsUpdate=!0,e}function Vd(e){let n=new Uint8Array(4*e);for(let r=0;r<e;r++)n.set($d,r*4);let t=new Ur(n,1,1,e);return t.needsUpdate=!0,t}var bn={tGrass:{value:null},tSand:{value:null},tBark:{value:null},tBuilt:{value:null}};function Kd(e){return e.wrapS=e.wrapT=fn,e.anisotropy=wt?16:8,e.colorSpace=un,e.generateMipmaps=!0,e.minFilter=$t,e.magFilter=St,e.needsUpdate=!0,e}var zd=!1,ul=[];function Ao(){if(zd||(zd=!0,bn.tGrass.value=kd(),bn.tSand.value=kd(),bn.tBark.value=Vd(cl.length),bn.tBuilt.value=Vd(fl.length),typeof document>"u"||typeof Image>"u"))return bn;let e=new Es;for(let[n,t]of Ot?[["grass","tGrass"]]:[["grass","tGrass"],["sand","tSand"]])ul.push(new Promise(r=>e.load(`${Xd}${n}.png`,o=>{bn[t].value=Kd(o),r()},void 0,()=>{console.warn(`Couldn't load the ${n} texture: the shader's own detail stays`),r()})));return Wd("bark",cl,"tBark","the trunks stay plain"),Wd("built",fl,"tBuilt","paths and walls keep their shader's own detail"),bn}function Wd(e,n,t,r){let o=n.map(a=>{let s=new Image;return s.src=`${Xd}${e}-${a}.png`,s.decode().then(()=>s)}),i=Promise.all(o).then(a=>{let s=a[0].naturalWidth,l=document.createElement("canvas");l.width=l.height=s;let c=l.getContext("2d",{willReadFrequently:!0}),f=new Uint8Array(s*s*4*a.length);a.forEach((d,h)=>{c.clearRect(0,0,s,s),c.drawImage(d,0,0,s,s),f.set(c.getImageData(0,0,s,s).data,h*s*s*4)});let u=new Ur(f,s,s,a.length);bn[t].value=Kd(u)}).catch(()=>console.warn(`Couldn't load the ${e} textures: ${r}`));ul.push(i)}function KA(){return Promise.all(ul).then(()=>Object.values(bn).map(e=>e.value).filter(Boolean))}var YA=`
  vec3 leanUv(vec3 n, vec3 viewPos, vec2 uv, vec2 lean, float k) {
    vec3 q0 = dFdx(-viewPos);
    vec3 q1 = dFdy(-viewPos);
    vec2 s0 = dFdx(uv);
    vec2 s1 = dFdy(uv);
    vec3 q1p = cross(q1, n);
    vec3 q0p = cross(n, q0);
    vec3 T = q1p * s0.x + q0p * s1.x;
    vec3 B = q1p * s0.y + q0p * s1.y;
    float det = max(dot(T, T), dot(B, B));
    float sc = det == 0.0 ? 0.0 : inversesqrt(det);
    return normalize(n + (T * lean.x + B * lean.y) * sc * k);
  }
`;var Yd=["even","rings","lush"];function ZA(e=1){let n=Math.imul((e|0)^24350,2654435761)>>>0;return n=(n^n>>>15)>>>0,Yd[n%Yd.length]}var qd={width:.8,phase:.5};var Zd="gr13",WS="vec3(0.8, 0.95, 1.02)",Wr={gWindDir:{value:[1,0]},gWindOff:{value:0},gWindK:{value:0},gWet:{value:0},gDry:{value:0},gRain:{value:0},gTime:{value:0},gFarRough:{value:[0,1,2,3]},gFarRoughK:{value:0}},XS={on:!0},$S=`
  uniform vec2 gWindDir;
  uniform float gWindOff;
  uniform float gWindK;
  uniform float gWet;
  uniform float gDry;
  uniform float gRain;
  uniform float gTime;
  uniform vec4 gFarRough;
  uniform float gFarRoughK;
`;function KS(e){let n=hl(e?.wet),t=hl(e?.dry)*(1-n);if(!e||e.still)return{wind:0,speed:0,dir:[1,0],wet:n,dry:t};let r=Math.max(0,e.mph??0),o=Math.min(1,Math.max(0,(r-3)/17)),i=Math.max(.6,Math.min(1.4,1+((e.gust??1)-1)*1.3)),a=Math.min(1,o*i),s=Math.max(0,e.gusting??r)*.447*.65;return{wind:a,speed:s,dir:e.dir??[1,0],wet:n,dry:t}}var hl=e=>Number.isFinite(e)?Math.min(1,Math.max(0,e)):0,dl=null;function nR(e,n){let t=dl===null?0:Math.min(.25,Math.max(0,e-dl));dl=e;let r=KS(n),o=Wr;o.gWindDir.value=r.dir,o.gWindOff.value+=r.speed*t,o.gWindK.value+=(r.wind-o.gWindK.value)*Math.min(1,t*1.2),o.gWindK.value<.002&&r.wind===0&&(o.gWindK.value=0),o.gWet.value=r.wet,o.gDry.value=r.dry,o.gRain.value=XS.on?hl(n?.rain):0,o.gTime.value=e%600;for(let i of jd)i(o);return r}var jd=new Set;function rR(e){return jd.add(e),e}var Qd=([e,n])=>[n,-e],Jd=`
  float gHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float gNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(gHash(i), gHash(i + vec2(1.0, 0.0)), u.x),
               mix(gHash(i + vec2(0.0, 1.0)), gHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float gFbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * gNoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }
  // The rough's light and dark patches: soft-edged, irregular stretches of
  // darker, lusher grass and of paler, drier grass, a few metres to twenty
  // or so across (the size they'd be from where a player stands), with
  // clumps within them. k: how strong (0 none; the rough 1, deep rough more).
  // Used by the designed holes' grass and the mapped holes' ground alike.
  vec3 gRoughPatches(vec3 grass, vec2 w, float k) {
    float big = gFbm(w * 0.07 + 41.0);
    float clump = gNoise(w * 0.45 + 7.0);
    float drift = gNoise(w * 0.16 + 3.0);
    float wobble = (clump - 0.5) * 0.14 + (drift - 0.5) * 0.1;
    float darkP = smoothstep(0.46, 0.62, big + wobble);
    float lightP = smoothstep(0.52, 0.66, 1.0 - big + wobble);
    grass *= 1.0 - k * 0.36 * darkP;
    grass *= mix(vec3(1.0), vec3(0.93, 1.0, 1.06), k * darkP);
    grass = mix(grass, grass * vec3(1.24, 1.17, 0.92), k * lightP);
    grass *= 1.0 + k * 0.18 * (clump - 0.5);
    // Clover: small patches, a metre or two across, of a darker, bluer
    // green, in the rough's lusher stretches (from the clumps' own noise,
    // no more reads of it).
    float clover = smoothstep(0.66, 0.74, clump) * (1.0 - lightP) * smoothstep(0.45, 0.65, drift);
    grass = mix(grass, grass * ${WS}, min(k, 1.0) * clover);
    // And broad swathes, lighter and darker over forty metres or so - the
    // lighter drier and goldier, the darker lusher and bluer, so from the
    // air the rough and long grass change shade across the hole in
    // patches, tufts and ground alike (the owner: "the grass to change in
    // shades of colour in patches and across areas").
    float swathe = gFbm(w * 0.022 + 13.0) - 0.44;
    grass *= 1.0 + k * 0.24 * swathe;
    float kk = min(k, 1.5);
    grass = mix(grass, grass * vec3(1.1, 1.04, 0.8), kk * 0.55 * smoothstep(0.02, 0.2, swathe));
    grass = mix(grass, grass * vec3(0.9, 1.0, 1.08), kk * 0.5 * smoothstep(-0.02, -0.18, swathe));
    return grass;
  }
`,YS=`
  ${$S}
  const vec3 G_STRAW = ${go(pt.straw)};
  const float G_WET = ${lu.toFixed(4)};
  float gLuma(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
  }
  // Straw on a firm day (gDry): patches (p, a patch value, 0 - 1) of this
  // grass turn the palette's straw at the grass's own brightness, so the
  // steps between the grasses hold. k: how much this grass takes (1 the
  // fairways and rough, 0 a green).
  vec3 gStraw(vec3 grass, float p, float k) {
    float s = gDry * k * smoothstep(0.48, 0.74, p);
    return mix(grass, G_STRAW * (gLuma(grass) / gLuma(G_STRAW)) * 1.06, s * 0.6);
  }
  // After rain (gWet): every grass alike a shade darker, by the palette's
  // one wet factor, so the steps between them hold.
  vec3 gWetGround(vec3 grass) {
    return grass * mix(1.0, G_WET, gWet);
  }

  // How a mower's line wavers: in stripes (add it to a stripe coordinate).
  float gWaver(vec2 w) {
    return (gNoise(w * 0.045) - 0.5) * 0.3;
  }

  // Two-tone mowing stripes along t (in stripes: one light and one dark
  // band to each whole number): 0 light, 1 dark, the edges e stripes soft.
  float gMowSoft(float t, float e) {
    return smoothstep(0.5 - e, 0.5 + e, abs(fract(t) - 0.5) * 2.0);
  }

  // gMowing's stripes (in GROUND), in a vertex shader too: their edges e
  // stripes soft - where the ground's are a pixel and a half (gMow) - for
  // Ultra's short grass across the hole, each clump the shade of the
  // stripe it stands in (look/groundbits.js).
  float gMowingAt(vec2 w, vec2 dir, float width, float kind, vec2 centre, float e) {
    float wv = gWaver(w);
    if (kind > 1.5) return gMowSoft(length(w - centre) / width + wv, e);
    vec2 s = w - centre;
    float a = gMowSoft(dot(s, dir) / width + wv, e);
    if (kind > 0.5) a = 0.5 * (a + gMowSoft(dot(s, vec2(-dir.y, dir.x)) / width + wv * 0.8, e));
    return a;
  }

  // A grass's own variety, at world position w: patches (how strong:
  // amount; how big: patchScale, per metre), a broad drift over a couple of
  // hundred metres so a long view down the hole isn't one flat block of
  // green, patches a few paces to a few tens of metres across (the size a
  // stretch of rough fills seen from the tee), and its hue - dry,
  // straw-coloured patches and lush, bluer ones (how much: tint).
  vec3 gGrassBase(vec3 grass, vec2 w, float amount, float patchScale, float tint) {
    float n = gFbm(w * patchScale);
    grass *= 1.0 + amount * (n - 0.5) * 2.0;
    grass *= mix(vec3(0.8, 0.86, 0.95), vec3(1.14, 1.1, 0.88), gNoise(w * 0.006 + 31.0));
    grass *= 1.0 + amount * 0.55 * (gNoise(w * 0.06 + 5.0) + 0.6 * gNoise(w * 0.17 + 9.0) - 0.8) * 1.25;
    float parched = gFbm(w * patchScale * 0.55 + 17.0);
    float dry = smoothstep(0.42, 0.78, parched);
    // A soft day: a deeper green, the drier patches greened over.
    grass = mix(grass, grass * vec3(1.1, 1.03, 0.7), dry * tint * (1.0 - 0.7 * gWet));
    float lush = gNoise(w * patchScale * 2.7 + 5.0);
    grass *= mix(vec3(1.0), vec3(0.9, 1.0, 1.06), lush * tint);
    // A firm day: straw in the same drier patches - on the fairways, tees
    // and fringes and in the rough (the grasses with some hue of their
    // own), never on a green (tint 0.2).
    return gStraw(grass, parched, smoothstep(0.3, 0.45, tint));
  }

  // The wind across long grass: soft, lighter bands - the grass bent over,
  // showing its paler side - running downwind, long across the wind and
  // wandering, at most 6% brighter, stronger in a gust, and gone beyond
  // about 300 m (world: the point's world position; k: how long the grass
  // is, 1 the rough's). None in a calm.
  vec3 gWindWaves(vec3 grass, vec2 w, vec3 world, float k) {
    if (gWindK * k <= 0.0) return grass;
    float u = dot(w, gWindDir) - gWindOff;
    float v = dot(w, vec2(-gWindDir.y, gWindDir.x));
    float b = min(1.0, smoothstep(0.5, 0.85, gNoise(vec2(u * 0.085, v * 0.022) + 23.0)) * gWindK * k);
    // (A links hole's long grass - k over 1.5 - shows them further and
    // stronger: the wind running across the dunes.)
    float reach = max(1.0, k * 0.8);
    b *= 1.0 - smoothstep(200.0 * reach, 300.0 * reach, distance(world.xz, cameraPosition.xz));
    vec3 pale = vec3(dot(grass, vec3(0.2126, 0.7152, 0.0722)));
    return mix(grass, mix(grass, pale, 0.3 + 0.08 * max(0.0, k - 1.0)) * (1.0 + 0.045 * max(1.0, k)), b);
  }
`,eh=`
  ${YS}

  // The far rough (sim/farrough.mjs; fragment shaders only - GROUND, not
  // GROUND_COLOUR, which the long grass's vertices run): past where the 3D long grass thins,
  // the rough read as standing grass - its colours the long grass's own
  // (look/longgrass.js: a clump's foot 0.7 of the ground's colour, its tips
  // 1.15) - darker in the gaps between tufts, the tops paler and showing
  // more when looked across low, and the long grass's own wave
  // (the same sine down the wind) brightening it as it passes. k: how long
  // the grass is (gWindWaves's k: 1 the rough's).
  vec3 gFarRoughLook(vec3 grass, vec2 w, vec3 world, float k) {
    // (The finer tufts' blur worked out first: derivatives only outside a branch.)
    float fine = 1.0 - smoothstep(0.08, 0.35, fwidth(w.x * 2.6));
    if (gFarRoughK <= 0.0 || k <= 0.0) return grass;
    // (By the distance from the camera, height and all: seen from the air -
    // a flyover, a drive followed up - the rough under the camera is
    // standing grass too, as the tufts on it are, not a flat carpet between
    // them.)
    float dist = distance(world, cameraPosition);
    float gFarRoughOn = smoothstep(gFarRough.x, gFarRough.y, dist) * (1.0 - smoothstep(gFarRough.z, gFarRough.w, dist));
    float a = gFarRoughOn;
    // (Near the camera, inside the long grass, none of it runs.)
    if (gFarRoughOn > 0.0) {
      a *= gFarRoughK * min(k, 1.5);
      // Tufts and gaps: two scales of noise, the finer gone before it shimmers.
      float c = mix(0.5, gNoise(w * 2.6 + 13.0), fine) * 0.45 + gNoise(w * 0.9 + 41.0) * 0.55;
      float top = smoothstep(0.3, 0.72, c);
      // Looked across low, the tops hide the gaps.
      vec3 toEye = normalize(cameraPosition - world);
      float graze = 1.0 - smoothstep(0.04, 0.45, toEye.y);
      top = mix(top, 1.0, graze * 0.55);
      vec3 col = grass * mix(0.78, 1.12, top);
      // The long grass's wave, down the wind, its tips' paler side.
      float wave = 0.5 + 0.5 * sin(dot(world.xz, gWindDir) * 1.7 - gWindOff * 1.7 + world.x * 0.3);
      col = mix(col, vec3(gLuma(col)) * 1.12, 0.25 * wave * gWindK * top);
      grass = mix(grass, col, a);
    }
    return grass;
  }

  // Two-tone mowing stripes along t (gMowSoft), soft-edged and blurred
  // out far away, where they'd shimmer: their edges a pixel and a half.
  float gMow(float t) {
    return gMowSoft(t, clamp(fwidth(t) * 1.5, 0.02, 0.5));
  }

  // Mowing: stripes width metres wide changing along dir (unit length),
  // wavering as a mower's line does. kind 0: one way; 1: checked, a second
  // set across the first (three shades where they cross); 2: rings round
  // centre, as a range's target greens are mown. 0 light, 1 dark.
  float gMowing(vec2 w, vec2 dir, float width, float kind, vec2 centre) {
    float wv = gWaver(w);
    if (kind > 1.5) return gMow(length(w - centre) / width + wv);
    // (Stripes start from centre too: a neighbour's from its own tee, as
    // when it's played; a played hole's tee is the origin.)
    vec2 s = w - centre;
    float a = gMow(dot(s, dir) / width + wv);
    if (kind > 0.5) a = 0.5 * (a + gMow(dot(s, vec2(-dir.y, dir.x)) / width + wv * 0.8));
    return a;
  }

  // A clean-up pass: the tone of the band a mower leaves going round the
  // edge (of a fairway, inside a green's fringe), between the two stripes.
  const float G_CLEANUP = 0.62;

  // Blades, fading out as they get smaller than a pixel: the blade texture
  // (tiled every scale metres) multiplied in, by strength. d: the blade
  // texture's value here; fade: how much of the blades still shows.
  // On High (GROUND_FINE) a second scale of blades, finer and turned
  // against the first, so grass close to - at address, under the putting
  // camera - stops reading as felt; inside the same fade.
  // With the blade texture (GROUND_TEX, High: look/textures.js) the
  // blades also lean, from the texture's normal map: gLean, how far across
  // world x and z, for gLeanNormal to tilt the lit normal by - so the sun
  // catches the blades rather than lighting a painted carpet.
  vec2 gLean = vec2(0.0);
  vec3 gBlades(vec3 grass, vec2 w, sampler2D detail, float scale, float strength, out float d, out float fade) {
    vec3 t1 = texture2D(detail, w / scale).rgb;
    d = t1.r;
    fade = 1.0 - smoothstep(0.02, 0.25, fwidth(w.x / scale));
    #ifdef GROUND_TEX
    // (The texture's rows run down the picture; its v runs up it.)
    gLean = vec2(t1.g * 2.0 - 1.0, 1.0 - t1.b * 2.0) * strength * fade;
    #endif
    #ifdef GROUND_FINE
    // (Not on the phone, GROUND_PHONE: too fine for its picture.)
    #ifndef GROUND_PHONE
    mat2 turn = mat2(0.8, 0.6, -0.6, 0.8);
    vec3 t2 = texture2D(detail, turn * w / (scale * 0.37) + 0.31).rgb;
    float fine = 1.0 - smoothstep(0.02, 0.25, fwidth(w.x / (scale * 0.37)));
    d = mix(d, d * t2.r * 1.35, fine);
    #ifdef GROUND_TEX
    gLean += transpose(turn) * vec2(t2.g * 2.0 - 1.0, 1.0 - t2.b * 2.0) * strength * fine * 0.6;
    #endif
    #ifdef GROUND_HERO
    // The Sharp ground textures switch (sim/effects.mjs textures): a third,
    // finer layer still, the cut grass's own blades, only in the last few
    // metres round the camera - at address, round the ball - and gone
    // before it would shimmer. Skipped where it doesn't show.
    float heroScale = scale * 0.16;
    float hero = 1.0 - smoothstep(0.03, 0.2, fwidth(w.x / heroScale));
    if (hero > 0.0) {
      mat2 turn3 = mat2(0.28, -0.96, 0.96, 0.28);
      vec3 t3 = texture2D(detail, turn3 * w / heroScale + 0.67).rgb;
      d = mix(d, d * (0.55 + t3.r * 0.75), hero * fine);
      #ifdef GROUND_TEX
      gLean += transpose(turn3) * vec2(t3.g * 2.0 - 1.0, 1.0 - t3.b * 2.0) * strength * hero * fine * 0.45;
      #endif
    }
    #endif
    #endif
    #endif
    #ifdef GROUND_TEX
    // (Leaning blades scatter the sun a little: as bright as before, on
    // average.)
    grass *= 1.0 + 0.045 * strength * fade;
    #endif
    grass *= mix(1.0, 0.45 + d * 0.75, strength * fade);
    // Past where the blades are too small to draw, the same picture
    // larger - tufts and runs of grass seven times the size, then forty -
    // so the ground keeps a grain however far off, never smooth smears of
    // colour (the owner, of a links hole from above: "far too blocky").
    // Each fades in as the one before fades out, and out before it would
    // shimmer.
    float gone = 1.0 - fade;
    if (gone > 0.0) {
      float s7 = scale * 7.0;
      float s40 = scale * 40.0;
      float midK = 1.0 - smoothstep(0.04, 0.3, fwidth(w.x / s7));
      float farK = 1.0 - smoothstep(0.04, 0.3, fwidth(w.x / s40));
      float tm = texture2D(detail, mat2(0.6, 0.8, -0.8, 0.6) * w / s7 + 0.53).r;
      float tf = texture2D(detail, mat2(0.8, -0.6, 0.6, 0.8) * w / s40 + 0.17).r;
      float macro = mix(1.0 + (tf - 0.5) * 0.55 * farK, 1.0 + (tm - 0.5) * 0.8, midK);
      grass *= mix(1.0, macro, gone * (0.5 + 0.5 * min(strength, 1.0)));
    }
    return grass;
  }

  // Daisies (cream, never white) and dandelions (yellow) in the rough,
  // close up only: a flower or none in each cell of a small grid, in
  // drifts some metres across, and gone before a flower would be under a
  // pixel. Hashes only, no noise. k: how much of the rough is here.
  vec3 gFlowers(vec3 grass, vec2 w, float k) {
    float show = k * (1.0 - smoothstep(0.006, 0.016, fwidth(w.x)));
    if (show <= 0.0) return grass;
    vec2 cell = floor(w / 0.3);
    vec2 f = fract(w / 0.3);
    float h = gHash(cell + 71.3);
    float drift = gHash(floor(w / 7.0) + 5.1);
    if (h < 1.0 - 0.3 * smoothstep(0.35, 0.85, drift)) return grass;
    vec2 at = 0.25 + 0.5 * vec2(fract(h * 37.1), fract(h * 91.7));
    float r = length(f - at) * 0.3;
    float bloom = (1.0 - smoothstep(0.012, 0.018, r)) * show;
    vec3 flower = fract(h * 13.7) < 0.55 ? ${go(pt.daisy)} : ${go(pt.dandelion)};
    // A daisy's yellow heart.
    flower = mix(flower, ${go(pt.dandelion)}, 1.0 - smoothstep(0.003, 0.005, r));
    return mix(grass, flower, bloom);
  }

  // Duller with distance - a third less colourful by 800 m - so the
  // playing ground is the greenest thing in view and the country beyond
  // melts into the haze rather than running on as a bright carpet.
  // (Luminance weights as written: the colours are linear.)
  vec3 gDistance(vec3 grass, vec3 world) {
    float far = smoothstep(150.0, 800.0, distance(world.xz, cameraPosition.xz));
    return mix(grass, vec3(dot(grass, vec3(0.2126, 0.7152, 0.0722))), far * 0.3);
  }
`;function th(e,n=.7){return`
    {
      vec3 lx = (viewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz;
      vec3 lz = (viewMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz;
      lx = normalize(lx - normal * dot(normal, lx));
      lz = normalize(lz - normal * dot(normal, lz));
      normal = normalize(normal + (lx * ${e}.x + lz * ${e}.y) * ${n.toFixed(3)});
    }`}var oR="co3",iR=`
  uniform sampler2D gCountryMap;
  uniform sampler2D gCourseMap;
  uniform vec3 gCountryBox;
  vec3 gCountry(vec3 grass, vec3 world) {
    vec2 uv = (world.xz - gCountryBox.xy) * gCountryBox.z;
    vec4 c = texture2D(gCountryMap, uv);
    if (c.a <= 0.001) return grass;
    // Its colour, but keeping half the grass's own light and dark - its
    // blades and tufts - so a patch painted in a picture metres a pixel
    // never lies over the grass as a smooth smear (the owner: "far too
    // blocky").
    vec3 paint = c.rgb / c.a;
    float l = dot(paint, vec3(0.2126, 0.7152, 0.0722));
    float g = dot(grass, vec3(0.2126, 0.7152, 0.0722));
    // (Near to; the far country's fields as they were.)
    float near = 1.0 - smoothstep(150.0, 400.0, distance(world.xz, cameraPosition.xz));
    float grain = clamp(g / max(l, 1e-4), 0.5, 1.6);
    // The course's other holes' mown ground, sand and water (sim/
    // neighbours.mjs paintNeighbours's mown): the grass under them is the
    // rough's - its light and dark patches, a links hole's paler crests
    // and lusher hollows, the far rough's standing tufts - and half of
    // that came through, so from the air their fairways looked like dunes.
    // There only a faint, short grain is kept (a few per cent of the
    // grass's light and dark, close to): a hole drawn plain, as the hole
    // being played and the map have it. (No noise of its own: the near
    // rough's lookups a pixel are capped - test/noisecount.test.mjs; and
    // only where the other holes are painted at all, Medium and up:
    // GROUND_FINE.)
    float mown = 0.0;
    #ifdef GROUND_FINE
    mown = texture2D(gCourseMap, uv).r;
    #endif
    float even = 1.0 + clamp(grain - 1.0, -0.06, 0.06) * near;
    vec3 grained = mix(mix(paint, paint * grain, 0.5 * near), paint * even, mown);
    return mix(grass, grained, c.a);
  }
`;var nh="st1";function rh(e,n){let t=Rd[n];return t&&(e.fragmentShader=e.fragmentShader.replace("#include <alphatest_fragment>",`#include <alphatest_fragment>
${yd(t)}`)),e}var oh=!1;function fR(e){oh=!!e}var qS=0;function on(e,n,t={}){if(e.userData.twin={kind:n,options:t},oh){let r=++qS,o=Object.prototype.hasOwnProperty.call(e,"customProgramCacheKey")?e.customProgramCacheKey:null;e.customProgramCacheKey=()=>`${o?o.call(e):""}#twin${r}`}return e}var ZS=`${md}-${Ed}-${nh}-${Cd}-${Dd}-${Fd}`;function zn(e,n){if(e.userData.hooks)return e;e.userData.hooks=n;let t=e.onBeforeCompile,r=Object.prototype.hasOwnProperty.call(e,"customProgramCacheKey")?e.customProgramCacheKey:null,o=t===e.constructor.prototype.onBeforeCompile||!Object.prototype.hasOwnProperty.call(e,"onBeforeCompile");return e.onBeforeCompile=(i,a)=>{o||t.call(e,i,a),Hd(i,n),bd(i,n),Pd(i,n),Ud(i,n),_d(i),rh(i,e.userData.seeThrough)},e.customProgramCacheKey=()=>`${r?r.call(e):o?"":t.toString()}|${n}${e.userData.seeThrough?`+${e.userData.seeThrough}`:""}|${ZS}`,o&&!e.userData.twin&&on(e,"hooked",{kind:n}),e}var ih=Pn(Gt("effects",{}),ft).seasons?ou(new Date):null,bR=ih,ah=e=>e==="summer"?null:{name:e,...iu[e]},wn=ah(ih??"summer"),sh=0;function wR({season:e="summer",upkeep:n=0}={}){wn=ah(e),sh=Math.min(1,Math.max(-1,Number.isFinite(n)?n:0))}function pl(e){return Number.isFinite(e)?e>=2?rr.share.green:e>=.75?rr.share.fairway:rr.share.rough:rr.share.rough}var Xr={h:0,s:0,l:0};function ml(e,n="grass",t=1){let r=n==="grass"?sh*t:0;if(!wn&&!r||(e.getHSL(Xr),Xr.h<.14||Xr.h>.5))return e;let o=[Xr.h,Xr.s,Xr.l];return wn&&(o=ws(o,wn[n])),r&&(o=ws(o,(r>0?rr.dry:rr.lush).map(i=>i*Math.abs(r)))),e.setHSL(o[0],o[1],o[2])}var gl=(e,n,t)=>ml(new ye(e),n,t);function jS(e,n,t,r,o,i,a,s,l){if(Math.min(e,t,o)>a+l||Math.max(e,t,o)<a-l||Math.min(n,r,i)>s+l||Math.max(n,r,i)<s-l)return!1;let c=(t-e)*(s-n)-(r-n)*(a-e),f=(o-t)*(s-r)-(i-r)*(a-t),u=(e-o)*(s-i)-(n-i)*(a-o);if(c>=0&&f>=0&&u>=0||c<=0&&f<=0&&u<=0)return!0;let d=l*l;return _l(e,n,t,r,a,s)<=d||_l(t,r,o,i,a,s)<=d||_l(o,i,e,n,a,s)<=d}function _l(e,n,t,r,o,i){let a=t-e,s=r-n,l=a*a+s*s,c=l>0?Math.max(0,Math.min(1,((o-e)*a+(i-n)*s)/l)):0,f=e+a*c-o,u=n+s*c-i;return f*f+u*u}function lh(e,n,t,r=2){let o=Math.floor((n?n.length:e.length/3)/3),i=new Uint8Array(o),a=0;for(let s=0;s<o;s++){let l=(n?n[s*3]:s*3)*3,c=(n?n[s*3+1]:s*3+1)*3,f=(n?n[s*3+2]:s*3+2)*3;jS(e[l],e[l+2],e[c],e[c+2],e[f],e[f+2],t.x,t.z,r)&&(i[s]=1,a++)}return{near:i,count:a}}function ch(e,n){let t=n.length,r=0;for(let a=0;a<t;a++)r+=n[a];let o=new Uint32Array((t-r)*3),i=new Uint32Array(r*3);for(let a=0,s=0,l=0;a<t;a++){let c=n[a]?i:o,f=n[a]?l:s;for(let u=0;u<3;u++)c[f+u]=e?e[a*3+u]:a*3+u;n[a]?l+=3:s+=3}return{far:o,near:i}}function fh(e){let n=new Map,t=new Uint32Array(e.length);for(let r=0;r<e.length;r++){let o=n.get(e[r]);o===void 0&&(o=n.size,n.set(e[r],o)),t[r]=o}return{vertices:Uint32Array.from(n.keys()),index:t}}function vl(e,n,t){let r=new e.constructor(t.length*n);for(let o=0;o<t.length;o++){let i=t[o]*n;for(let a=0;a<n;a++)r[o*n+a]=e[i+a]}return r}var JS="GROUND_UNCUT";function hh(e,n){return n&&n.r>0&&(e.userData.cupCut={x:n.x,z:n.z,r:n.r}),e}var uh=new WeakMap;function dh(e){let n=uh.get(e);if(n)return n;n=new e.constructor;let t=e.userData;e.userData={};try{n.copy(e)}finally{e.userData=t}return n.userData={...t},delete n.userData.cupCut,delete n.userData.twin,n.userData.uncut=!0,n.onBeforeCompile=e.onBeforeCompile,Object.prototype.hasOwnProperty.call(e,"customProgramCacheKey")&&(n.customProgramCacheKey=e.customProgramCacheKey),n.defines={...e.defines??{},[JS]:""},t.twin&&on(n,t.twin.kind,{...t.twin.options,uncut:!0}),t.shared||n.addEventListener("dispose",()=>e.dispose()),uh.set(e,n),n}function ex(e){let n=e.elements;return n[0]===1&&n[5]===1&&n[10]===1&&n[1]===0&&n[2]===0&&n[4]===0&&n[6]===0&&n[8]===0&&n[9]===0&&n[3]===0&&n[7]===0&&n[11]===0&&n[15]===1}function tx(e,n){let t=new xt;for(let[r,o]of Object.entries(e.attributes))t.setAttribute(r,new Ie(vl(o.array,o.itemSize,n.vertices),o.itemSize,o.normalized));return t.setIndex(new Ie(n.vertices.length>65535?n.index:Uint16Array.from(n.index),1)),t}function nx(e,n){if(e.index){let t=0;for(let r=0;r<n.length;r++)n[r]>t&&(t=n[r]);e.setIndex(new Ie(t>=65535?n:Uint16Array.from(n),1))}else for(let[t,r]of Object.entries(e.attributes))e.setAttribute(t,new Ie(vl(r.array,r.itemSize,n),r.itemSize,r.normalized))}function PR(e,n=2){let t={pieces:0,uncut:0,split:0,patch:0},r=[];e.traverse(i=>{i.isMesh&&!i.isInstancedMesh&&!i.isBatchedMesh&&!Array.isArray(i.material)&&i.material?.userData?.cupCut&&r.push(i)}),e.updateWorldMatrix(!0,!0);for(let i of[...new Set(r.map(a=>a.material))].sort((a,s)=>a.id-s.id))dh(i);let o=new Map;for(let i of r){t.pieces++;let a=i.material,s=i.geometry,l=s.attributes.position;if(!l||l.isInterleavedBufferAttribute||s.groups.length||s.drawRange.start!==0||s.drawRange.count!==1/0||Object.keys(s.morphAttributes).length||!ex(i.matrixWorld))continue;let f=a.userData.cupCut,u={x:f.x-i.matrixWorld.elements[12],z:f.z-i.matrixWorld.elements[14]},d=o.get(s);if(!d){s.boundingBox||s.computeBoundingBox();let h=s.boundingBox,T=u.x<h.min.x-n||u.x>h.max.x+n||u.z<h.min.z-n||u.z>h.max.z+n?{count:0}:lh(l.array,s.index?.array??null,u,n);if(d={found:T,patch:null},T.count&&T.count<T.near.length&&!a.transparent){let p=ch(s.index?.array??null,T.near);d.patch=tx(s,fh(p.near)),nx(s,p.far),t.split++,t.patch+=T.count}o.set(s,d)}if(!(d.found.count&&!d.patch)){if(d.patch){let h=new yt(d.patch,a);h.name=i.name?`${i.name} (round the cup)`:"round the cup";for(let T of["castShadow","receiveShadow","renderOrder","frustumCulled","visible","matrixAutoUpdate","customDepthMaterial","customDistanceMaterial"])h[T]=i[T];h.layers.mask=i.layers.mask,h.position.copy(i.position),h.quaternion.copy(i.quaternion),h.scale.copy(i.scale),h.userData={...i.userData},delete h.userData.keepGeometry;let _=i.parent;_.add(h),_.children.splice(_.children.indexOf(h),1),_.children.splice(_.children.indexOf(i)+1,0,h),h.updateMatrixWorld(!0)}i.material=dh(a),t.uncut++}}return t}function Ci(e){let n=e.length,t=0;for(let r=0;r<n;r++){let[o,i]=e[r],[a,s]=e[(r+1)%n];t+=o*s-a*i}return t>0?-1:1}function ph(e,n=Ci(e)){let t=e.length;return e.map((r,o)=>{let[i,a]=e[(o-1+t)%t],[s,l]=e[(o+1)%t],c=Math.hypot(s-i,l-a)||1;return[-(l-a)/c*n,(s-i)/c*n]})}function DR(e,{r:n=.01,every:t=Math.PI/12,sharp:r=Math.PI/6}={}){let o=e.length,i=Ci(e),a=(f,u)=>{let d=Math.hypot(u[0]-f[0],u[1]-f[1])||1;return[(u[0]-f[0])/d,(u[1]-f[1])/d]},s=([f,u])=>[-u*i,f*i],l=[],c=[];for(let f=0;f<o;f++){let u=e[f],d=a(e[(f-1+o)%o],u),h=a(u,e[(f+1)%o]),_=s(d),T=s(h),p=Math.acos(Math.max(-1,Math.min(1,_[0]*T[0]+_[1]*T[1])));if(p<r||_[0]*h[0]+_[1]*h[1]>=0){l.push(u),c.push(f);continue}let m=Math.atan2(_[1],_[0]),v=Math.sign(_[0]*T[1]-_[1]*T[0]),x=Math.ceil(p/t);for(let g=0;g<=x;g++){let E=m+v*p*g/x;l.push([u[0]+Math.cos(E)*n,u[1]+Math.sin(E)*n]),c.push(f)}}return[l,c]}var ar={share:.6,fadeIn:.5,minFade:4,near:ys.full,end:150,fadeOut:.3,strength:1};function mh(e,{longGrass:n=!0,shed:t=!1}={}){if(t||e==="standard"||!e)return null;let r=n?ys.radius[e]:void 0,o=r?r*ar.share:ar.near,i=o+Math.max(ar.minFade,o*ar.fadeIn),a=ar.end;return{start:o,full:i,fadeFrom:a*(1-ar.fadeOut),end:a,strength:ar.strength}}var gh="far rough",rx="long grass";function _h(){let e=(ft==="high"||ft==="ultra")&&!rl(rx),n=mh(ft,{longGrass:e,shed:rl(gh)});Wr.gFarRough.value=n?[n.start,n.full,n.fadeFrom,n.end]:[0,1,2,3],Wr.gFarRoughK.value=n?n.strength:0}dn(2.8,gh,_h,{of:"medium"});_h();var Sl=Ce&&Pn(Gt("effects",{}),ft).textures,El=Ce&&Pn(Gt("effects",{}),ft).wetshine,xl=At||El,Wn=null,Dt={rough:0,apron:.25,deep:.5,semi:.75,fairway:1,fairwayEdge:1.1,wear:1.5,fringe:2,tee:2,divot:2.1,verge:2.2,path:2.5,green:3,lip:4,sand:5,bank:4,water:6};function Ml(e,n){let t=Dt.green-n;return t!==0&&Object.assign(e,{polygonOffset:!0,polygonOffsetFactor:t,polygonOffsetUnits:t*2}),e.userData.groundLayer=n,e}function ox(){if(Wn)return Wn;let e=256,n=document.createElement("canvas");n.width=n.height=e;let t=n.getContext("2d");t.fillStyle="rgb(200,200,200)",t.fillRect(0,0,e,e);for(let r=0;r<9e3;r++){let o=Math.random()*e,i=Math.random()*e,a=Math.random()*Math.PI,s=2+Math.random()*5,l=150+Math.random()*100;t.strokeStyle=`rgba(${l},${l},${l},0.55)`,t.lineWidth=1,t.beginPath(),t.moveTo(o,i),t.lineTo(o+Math.cos(a)*s,i+Math.sin(a)*s),t.stroke()}return Wn=new ho(n),Wn.wrapS=Wn.wrapT=fn,Wn.anisotropy=8,Wn.colorSpace=un,Wn}function r2({light:e="#6aa640",dark:n="#5c9637",stripeWidth:t=8,stripeAngle:r=Math.PI/2,patch:o=.22,patchScale:i=.03,detailScale:a=1.2,detail:s=.8,tint:l=.5,hole:c=null,edge:f=!1,layer:u=Dt.green,worn:d=0,soil:h="#7d6a4b",clumps:_=0,settle:T=!1,wind:p=0,dune:m=0,mow:v=0,mowDir:x=null,centre:g=null,cleanup:E=!1,rim:b=!1,edgeRings:w=!1,grain:S=null,shine:A=1}={}){let C=Ml(new En({color:16777215}),u);f&&Object.assign(C,{transparent:!0,depthWrite:!1});let P=!!c&&c.r>0;hh(C,c);let D={gLight:{value:gl(e,"grass",pl(u))},gDark:{value:gl(n,"grass",pl(u))},gStripeWidth:{value:t},gStripeDir:{value:x?new je(...x).normalize():new je(Math.cos(r),Math.sin(r))},gMowKind:{value:v},gMowCentre:{value:new je(...g??[0,0])},gPatch:{value:o},gPatchScale:{value:i},gDetail:Ce?Ao().tGrass:{value:ox()},gDetailScale:{value:a},gDetailStrength:{value:s},gTint:{value:l},gHole:{value:new te(c?.x??0,c?.z??0,c?.r??0)},gWorn:{value:d},gSoil:{value:new ye(h)},gClumps:{value:_},gWindy:{value:p},gDune:{value:m},gGrain:{value:new te(...S?[...new je(...S).normalize().toArray(),uu.sheen]:[1,0,0])},gShine:{value:A}};return C.onBeforeCompile=U=>{Object.assign(U.uniforms,D,Wr),U.vertexShader=U.vertexShader.replace("#include <common>",`#include <common>
varying vec3 gWorld;${f?`
attribute float gEdgeIn;
varying float gEdge;`:""}${b||w?`
attribute float gRimIn;
varying float gRim;`:""}`).replace("#include <project_vertex>",`#include <project_vertex>
gWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;${f?`
gEdge = gEdgeIn;`:""}${b||w?`
gRim = gRimIn;`:""}`),U.fragmentShader=U.fragmentShader.replace("#include <common>",`#include <common>
        varying vec3 gWorld;
        uniform vec3 gLight;
        uniform vec3 gDark;
        uniform float gStripeWidth;
        uniform vec2 gStripeDir;
        uniform float gMowKind;
        uniform vec2 gMowCentre;
        uniform float gPatch;
        uniform float gPatchScale;
        uniform sampler2D gDetail;
        uniform float gDetailScale;
        uniform float gDetailStrength;
        uniform float gTint;
        uniform vec3 gHole;
        uniform float gWorn;
        uniform vec3 gSoil;
        uniform float gClumps;
        uniform float gWindy;
        uniform float gDune;
        uniform vec3 gGrain;
        uniform float gShine;
        ${f?"varying float gEdge;":""}
        ${b||w?"varying float gRim;":""}
        ${Ce?Ot?`#define GROUND_FINE
#define GROUND_PHONE`:`#define GROUND_FINE
#define GROUND_TEX`:""}
        ${Sl?"#define GROUND_HERO":""}
        ${xl?"#define GROUND_PUDDLES":""}
        ${El&&!T?"#define GROUND_SHINE":""}
        ${Jd}
        ${eh}
        float gPuddle = 0.0;
        float gDrops = 0.0;`).replace("#include <map_fragment>",`#include <map_fragment>
        {
          vec2 w = gWorld.xz;
          float stripe = 0.0;
          // Soft-edged bands, their edges wavering as a mower's do, in the
          // hole's pattern.
          if (gStripeWidth > 0.0) stripe = ${w?`gMow(${qd.phase.toFixed(3)} - gRim / gStripeWidth + gWaver(w))`:"gMowing(w, gStripeDir, gStripeWidth, gMowKind, gMowCentre)"};
          ${E?"stripe = G_CLEANUP;":""}
          ${b?"stripe = mix(stripe, G_CLEANUP, 1.0 - smoothstep(0.55, 0.8, gRim));":""}
          // Far off - from high in a flyover - the long grass's and deep
          // rough's strongest patches eased (to the rough's), so round a
          // links hole its long grass isn't a dark, blotched band beside
          // the fairways (the owner: "a dark streaky band"). Close to, as
          // ever. (No more lookups: only how strong.)
          float gFarEase = smoothstep(${(T?Xn.from:Xn.fromAll).toFixed(1)}, ${(T?Xn.to:Xn.toAll).toFixed(1)}, distance(gWorld, cameraPosition));
          float gPatchK = mix(gPatch, min(gPatch, ${Xn.patch.toFixed(2)}), gFarEase);
          float gClumpK = mix(gClumps, min(gClumps, ${Xn.clumps.toFixed(2)}), gFarEase);
          vec3 grass = gGrassBase(mix(gLight, gDark, stripe), w, gPatchK, gPatchScale, gTint);
          if (gClumps > 0.0) grass = gRoughPatches(grass, w, gClumpK);
          if (gGrain.z > 0.0) {
            // The grain: blades lying away from the eye catch the sky and
            // look silvery and light, lying towards it show their darker
            // sides - so a green reads lighter down-grain, darker into it,
            // a little patchily, as the grass leans more in some spots.
            vec2 look = normalize(gWorld.xz - cameraPosition.xz + vec2(1e-4));
            float k = dot(look, gGrain.xy) * (0.75 + 0.5 * gNoise(w * 0.35 + 17.0));
            grass *= 1.0 + gGrain.z * k;
          }
          ${m>0?`          if (gDune > 0.0) {
            // Up a dune's face and over its crest the grass thins over the
            // sand, paler; down in a swale it's lusher and greener. (The
            // ground's normal in the world, from the drawn one.)
            vec3 nW = normalize((vec4(vNormal, 0.0) * viewMatrix).xyz);
            float steep = smoothstep(0.06, 0.32, 1.0 - abs(nW.y));
            float crest = smoothstep(0.7, 2.6, gWorld.y);
            float hollow = 1.0 - smoothstep(-0.5, 0.25, gWorld.y);
            float thin = max(steep * 0.85, crest * 0.6) * (0.75 + 0.5 * gNoise(w * 0.35 + 61.0));
            grass = mix(grass, grass * vec3(1.22, 1.12, 0.84), gDune * 0.55 * thin);
            grass = mix(grass, grass * vec3(0.86, 1.05, 0.88), gDune * 0.5 * hollow);
          }`:""}
          if (gWindy > 0.0) grass = gWindWaves(grass, w, gWorld, gWindy);
          // Past the long grass, the rough read as standing grass (look/farrough.js).
          ${Ce?"grass = gFarRoughLook(grass, w, gWorld, gWindy);":""}
          float d;
          float fade;
          grass = gBlades(grass, w, gDetail, gDetailScale, gDetailStrength, d, fade);
          // Under the long grass close to, its blades bolder (NEAR_FLOOR).
          if (gClumps > 0.5) grass *= 1.0 + ${_o.boost.toFixed(2)} * fade * (d - ${_o.mean.toFixed(3)}) * (1.0 - smoothstep(${_o.from.toFixed(1)}, ${_o.to.toFixed(1)}, distance(gWorld, cameraPosition)));
          #ifdef GROUND_FINE
          // Daisies and dandelions in the rough, close up (not on the
          // phone: a pixel's too big for one).
          #ifndef GROUND_PHONE
          if (gClumps > 0.0) grass = gFlowers(grass, w, min(gClumps, 1.0));
          #endif
          #endif
          ${f?`// Worn: scuffs of bare soil through the grass, most where it's
          // worn hardest (the middle of a track, next to the path), and the
          // grass round them drier and browner - never an even stripe.
          if (gWorn > 0.0) {
            float scuff = 0.55 * gNoise(w * 1.1 + 11.0) + 0.45 * gNoise(w * 3.7 + 3.0);
            float bare = smoothstep(0.7, 0.92, scuff + gEdge * 0.12) * gWorn * gEdge;
            // Drier and paler as it wears, unevenly.
            float dryer = gWorn * gEdge * (0.45 + 0.55 * gNoise(w * 0.7 + 23.0));
            grass = mix(grass, grass * vec3(1.12, 1.04, 0.74), dryer);
            vec3 soil = gSoil * (0.8 + 0.4 * gNoise(w * 7.0 + 2.0)) * mix(1.0, 0.7 + d * 0.5, fade);
            grass = mix(grass, soil, bare);
          }`:""}
          // And the long grass and deep rough far off settle towards their
          // own plain colour - as the country picture paints the long
          // grass past them - rather than a dark, blotched band (their
          // patches, the far macro grain and the dunes' hollows together).
          ${T?`grass = mix(grass, mix(gLight, gDark, 0.5) * ${Xn.flat.toFixed(2)}, gFarEase * ${Xn.settle.toFixed(2)});`:""}
          // A shade darker after rain.
          grass = gWetGround(grass);
          ${xl?`// On Ultra (or with wet reflections), after rain: puddles lying in the turf - in patches,
          // more and bigger the wetter it is, ragged at their edges; never
          // on the green with the cup.
          if (gWet > 0.05 && gHole.z <= 0.0) {
            float pn = 0.7 * gNoise(w * 0.09 + 31.0) + 0.3 * gNoise(w * 0.6 + 5.0);
            gPuddle = smoothstep(0.86 - 0.2 * gWet, 0.9 - 0.2 * gWet, pn) * smoothstep(0.05, 0.4, gWet);
            // The grass at a puddle's edge darker, soaked.
            grass *= 1.0 - 0.3 * smoothstep(0.78 - 0.2 * gWet, 0.88 - 0.2 * gWet, pn) * gWet;
          }`:""}
          ${Ce?`// While it rains (the Rain on the ground switch): drops splashing
          // on the turf near the camera - in half-metre cells, each its own
          // time, a ring spreading and fading - more the harder it rains.
          if (gRain > 0.02) {
            vec2 dc = floor(gWorld.xz * 2.0);
            vec2 df = fract(gWorld.xz * 2.0) - 0.5;
            float dh = fract(sin(dot(dc, vec2(12.9898, 78.233))) * 43758.5453);
            float dt = fract(gTime * 1.7 + dh * 7.0);
            vec2 dat = (vec2(fract(dh * 7.13), fract(dh * 3.71)) - 0.5) * 0.5;
            float dr = length(df - dat);
            float near = 1.0 - smoothstep(10.0, 28.0, distance(cameraPosition.xz, gWorld.xz));
            gDrops = (1.0 - smoothstep(0.0, 0.025, abs(dr - dt * 0.24))) * (1.0 - dt) * step(dh, gRain * 0.8) * near;
          }`:""}
          diffuseColor.rgb *= gDistance(grass, gWorld);
          ${P?`// The cup's hole - only in the patch round the cup (look/cupcut.js:
          // anywhere else the twin without it is drawn, GROUND_UNCUT).
          #ifndef GROUND_UNCUT
          if (gHole.z > 0.0 && distance(gWorld.xz, gHole.xy) < gHole.z) discard;
          #endif`:""}
          ${f?`// A ragged, soft line where it gives way to the ground beneath.
          float cut = 0.2 + 0.45 * gNoise(w * 0.35) + 0.2 * gNoise(w * 1.7);
          // Worn grass fades in softly and in clumps - thin here, thick
          // there - rather than to a ragged line.
          diffuseColor.a *= gWorn > 0.0
            ? smoothstep(0.12, 0.55, gEdge * (0.2 + 1.0 * gNoise(w * 1.3 + 7.0) + 0.45 * gNoise(w * 3.4)))
            : smoothstep(cut - 0.14, cut + 0.14, gEdge);`:""}
        }`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
${Ce?th("gLean"):""}`).replace("#include <opaque_fragment>",`#if defined(GROUND_PUDDLES) && defined(USE_FOG)
        if (gPuddle > 0.0) {
          vec3 pv = normalize(cameraPosition - gWorld);
          float pf = 0.3 + 0.7 * pow(1.0 - max(pv.y, 0.0), 4.0);
          vec3 sky = fogColor * 1.05;
          outgoingLight = mix(outgoingLight, mix(outgoingLight * 0.45, sky, pf), gPuddle);
        }
        #endif
        // The drops' rings: a glint of the sky's light, faint on the turf,
        // clear on a puddle.
        #ifdef USE_FOG
        if (gDrops > 0.0) outgoingLight = mix(outgoingLight, fogColor * 1.15, gDrops * mix(0.22, 0.7, gPuddle));
        #endif
        // Wet turf's sheen: the sky's light off it, little looking down on
        // it, more looking along it (a Fresnel rise), in patches as water
        // lies unevenly in a sward. (Not on the long grass and deep rough,
        // which don't lie flat to shine: a hundred metres off in the rain
        // they went a pale grey under it, and the trees on them read as
        // standing on a fairway. And the rough far less than mown grass
        // (gShine): it did the same along the show reel's 15th in the rain.)
        #if defined(GROUND_SHINE) && defined(USE_FOG)
        if (gWet > 0.02) {
          vec3 sv = normalize(cameraPosition - gWorld);
          float graze = pow(1.0 - max(sv.y, 0.0), 5.0);
          float lies = 0.55 + 0.45 * gNoise(gWorld.xz * 0.21 + 11.0);
          float sheen = gWet * (0.04 + 0.42 * graze) * lies * gShine;
          outgoingLight = mix(outgoingLight, fogColor * 1.08, sheen);
        }
        #endif
        #include <opaque_fragment>`)},C.customProgramCacheKey=()=>`grass-v12${m>0?"d":""}-${Zd}-${At?"u":Ce?"h":"s"}${Sl?"-hero":""}${Ot?"-p":""}${f?"-edge":""}${E?"-clean":""}${b?"-rim":""}${w?"-er2":""}${El?"-shine":""}${T?"-st":""}${P?"-cup":""}-r1`,on(C,"grass",{light:D.gLight.value,dark:D.gDark.value,stripeWidth:t,stripeAngle:r,mow:v,mowDir:x,centre:g,cleanup:E,rim:b,edgeRings:w,patch:o,patchScale:i,detailScale:a,detail:s,detailMap:D.gDetail,tint:l,hole:c,edge:f,layer:u,worn:d,soil:h,clumps:_,settle:T,wind:p,dune:m,grain:S,fine:Ce,hero:Sl,tex:Ce,puddleDark:xl}),zn(C,"ground")}function o2(e,n,t=()=>0,r=0){return ix(e,[{off:0,edge:1},{off:n,edge:0}],t,r)}function ix(e,n,t=()=>0,r=0){let o=e.length,i=Ci(e),a=ph(e,i),s=typeof n=="function"?n:()=>n,l=e.map((_,T)=>s(T)),c=l[0].length,f=[],u=[],d=[];for(let _=0;_<o;_++){let[T,p]=e[_],[m,v]=a[_];for(let x of l[_]){let g=T+m*x.off,E=p+v*x.off;f.push(g,t(g,E)+r,E),u.push(x.edge)}for(let x=0;x+1<c;x++){let g=_*c+x,E=(_+1)%o*c+x,b=l[_][x+1].off>l[_][x].off;i>0===b?d.push(g,g+1,E,E,g+1,E+1):d.push(g,E,g+1,E,E+1,g+1)}}let h=new xt;return h.setAttribute("position",new Zt(f,3)),h.setAttribute("gEdgeIn",new Zt(u,1)),h.setIndex(d),h.computeVertexNormals(),h}function i2(e,n,t,r){let o=e.geometry.attributes.position,i=new Float32Array(o.count);for(let a=0;a<o.count;a++){let s=o.getX(a)-n,l=o.getZ(a)-t;i[a]=r(Math.atan2(l,s))-Math.hypot(s,l)}return e.geometry.setAttribute("gRimIn",new Ie(i,1)),e}function a2(e){return{mow:e.kind,mowDir:Qd(e.dir)}}function s2(e,n,t,r,o=1){let i=[],a=(s,l,c,f)=>{let u=Math.max(1,Math.ceil(Math.hypot(c-s,f-l)/o));for(let d=0;d<u;d++)i.push([s+(c-s)*d/u,l+(f-l)*d/u])};return a(e,n,t,n),a(t,n,t,r),a(t,r,e,r),a(e,r,e,n),i}var mt=pt,vh=1,Pi=1.25,Xn={fromAll:90,toAll:240,from:25,to:110,patch:.2,clumps:.6,flat:.92,settle:.75},l2={rough:{light:mt.rough[0],dark:mt.rough[1],stripeWidth:0,patch:.35,patchScale:.02,detailScale:.9,tint:.7,clumps:vh,wind:1,shine:.25,layer:Dt.rough},deep:{light:mt.deep,dark:mt.deep,stripeWidth:0,patch:.45,patchScale:.05,detailScale:.7,detail:1,tint:.8,clumps:Pi,wind:1,settle:!0,layer:Dt.deep},duneRough:{light:mt.duneRough,dark:mt.duneRough,stripeWidth:0,patch:.2,patchScale:.03,detailScale:.9,detail:1,tint:.6,clumps:vh*.8,wind:2,dune:1,shine:.25,layer:Dt.rough},fescue:{light:mt.fescue,dark:mt.fescueDry,stripeWidth:0,patch:.22,patchScale:.035,detailScale:.6,detail:1,tint:.6,clumps:Pi*.7,wind:2.6,dune:1,settle:!0,layer:Dt.deep},hay:{light:mt.hay,dark:mt.hayDry,stripeWidth:0,patch:.25,patchScale:.03,detailScale:.6,detail:1,tint:.55,clumps:Pi*.6,wind:3.2,dune:1,settle:!0,layer:Dt.deep},longGreen:{light:mt.longGreen,dark:mt.longGreen,stripeWidth:0,patch:.65,patchScale:.035,detailScale:.7,detail:1,tint:.9,clumps:Pi*1.3,wind:2.3,dune:.7,settle:!0,layer:Dt.deep},fairway:{light:mt.fairway[0],dark:mt.fairway[1],stripeWidth:9,stripeAngle:Math.PI/2,patch:.18,layer:Dt.fairway},semi:{light:mt.firstCut[0],dark:mt.firstCut[1],stripeWidth:0,patch:.26,patchScale:.03,detailScale:.8,tint:.6,clumps:.35,wind:.5,shine:.6,layer:Dt.semi},green:{light:mt.green[0],dark:mt.green[1],stripeWidth:3,stripeAngle:0,patch:.1,patchScale:.08,detailScale:.5,detail:.5,tint:.2,layer:Dt.green},fringe:{light:mt.fringe,dark:mt.fringe,stripeWidth:0,patch:.12,detailScale:.7,layer:Dt.fringe},tee:{light:mt.tee[0],dark:mt.tee[1],stripeWidth:1.5,stripeAngle:0,patch:.1,layer:Dt.tee}};function c2(e,n,t=Dt.fairway){let r=new yt(e,n);return r.renderOrder=-10+t,r.receiveShadow=!0,r}function Ge(e,n=!1){let t=e[0].index!==null,r=new Set(Object.keys(e[0].attributes)),o=new Set(Object.keys(e[0].morphAttributes)),i={},a={},s=e[0].morphTargetsRelative,l=new xt,c=0;for(let f=0;f<e.length;++f){let u=e[f],d=0;if(t!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+f+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let h in u.attributes){if(!r.has(h))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+f+'. All geometries must have compatible attributes; make sure "'+h+'" attribute exists among all geometries, or in none of them.'),null;i[h]===void 0&&(i[h]=[]),i[h].push(u.attributes[h]),d++}if(d!==r.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+f+". Make sure all geometries have the same number of attributes."),null;if(s!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+f+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let h in u.morphAttributes){if(!o.has(h))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+f+".  .morphAttributes must be consistent throughout all geometries."),null;a[h]===void 0&&(a[h]=[]),a[h].push(u.morphAttributes[h])}if(n){let h;if(t)h=u.index.count;else if(u.attributes.position!==void 0)h=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+f+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,h,f),c+=h}}if(t){let f=0,u=[];for(let d=0;d<e.length;++d){let h=e[d].index;for(let _=0;_<h.count;++_)u.push(h.getX(_)+f);f+=e[d].attributes.position.count}l.setIndex(u)}for(let f in i){let u=Sh(i[f]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+f+" attribute."),null;l.setAttribute(f,u)}for(let f in a){let u=a[f][0].length;if(u!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[f]=[];for(let d=0;d<u;++d){let h=[];for(let T=0;T<a[f].length;++T)h.push(a[f][T][d]);let _=Sh(h);if(!_)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+f+" morphAttribute."),null;l.morphAttributes[f].push(_)}}}return l}function Sh(e){let n,t,r,o=-1,i=0;for(let c=0;c<e.length;++c){let f=e[c];if(n===void 0&&(n=f.array.constructor),n!==f.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=f.itemSize),t!==f.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(r===void 0&&(r=f.normalized),r!==f.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(o===-1&&(o=f.gpuType),o!==f.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;i+=f.count*t}let a=new n(i),s=new Ie(a,t,r),l=0;for(let c=0;c<e.length;++c){let f=e[c];if(f.isInterleavedBufferAttribute){let u=l/t;for(let d=0,h=f.count;d<h;d++)for(let _=0;_<t;_++){let T=f.getComponent(d,_);s.setComponent(d+u,_,T)}}else a.set(f.array,l);l+=f.count*t}return o!==void 0&&(s.gpuType=o),s}function Tl(e,n=1e-4){n=Math.max(n,Number.EPSILON);let t={},r=e.getIndex(),o=e.getAttribute("position"),i=r?r.count:o.count,a=0,s=Object.keys(e.attributes),l={},c={},f=[],u=["getX","getY","getZ","getW"],d=["setX","setY","setZ","setW"];for(let v=0,x=s.length;v<x;v++){let g=s[v],E=e.attributes[g];l[g]=new E.constructor(new E.array.constructor(E.count*E.itemSize),E.itemSize,E.normalized);let b=e.morphAttributes[g];b&&(c[g]||(c[g]=[]),b.forEach((w,S)=>{let A=new w.array.constructor(w.count*w.itemSize);c[g][S]=new w.constructor(A,w.itemSize,w.normalized)}))}let h=n*.5,_=Math.log10(1/n),T=Math.pow(10,_),p=h*T;for(let v=0;v<i;v++){let x=r?r.getX(v):v,g="";for(let E=0,b=s.length;E<b;E++){let w=s[E],S=e.getAttribute(w),A=S.itemSize;for(let C=0;C<A;C++)g+=`${Math.trunc(S[u[C]](x)*T+p)},`}if(g in t)f.push(t[g]);else{for(let E=0,b=s.length;E<b;E++){let w=s[E],S=e.getAttribute(w),A=e.morphAttributes[w],C=S.itemSize,P=l[w],D=c[w];for(let U=0;U<C;U++){let L=u[U],F=d[U];if(P[F](a,S[L](x)),A)for(let G=0,H=A.length;G<H;G++)D[G][F](a,A[G][L](x))}}t[g]=a,f.push(a),a++}}let m=e.clone();for(let v in e.attributes){let x=l[v];if(m.setAttribute(v,new x.constructor(x.array.slice(0,a*x.itemSize),x.itemSize,x.normalized)),v in c)for(let g=0;g<c[v].length;g++){let E=c[v][g];m.morphAttributes[v][g]=new E.constructor(E.array.slice(0,a*E.itemSize),E.itemSize,E.normalized)}}return m.setIndex(f),m}function d2(e,n=Math.PI/3){let t=e.index?e.toNonIndexed():e,r=t.attributes.position,o=r.count,i;if(r.isBufferAttribute===!0&&r.itemSize===3&&r.normalized===!1)i=r.array;else{i=new Float64Array(o*3);for(let g=0;g<o;g++)i[3*g+0]=r.getX(g),i[3*g+1]=r.getY(g),i[3*g+2]=r.getZ(g)}let a=Math.cos(n),s=(1+1e-10)*100,l=o/3,c=new Float64Array(l*3);for(let g=0;g<l;g++){let E=9*g,b=i[E+0],w=i[E+1],S=i[E+2],A=i[E+3],C=i[E+4],P=i[E+5],D=i[E+6],U=i[E+7],L=i[E+8],F=D-A,G=U-C,H=L-P,X=b-A,$=w-C,j=S-P,Z=G*j-H*$,ge=H*X-F*j,_e=F*$-G*X,ke=1/(Math.sqrt(Z*Z+ge*ge+_e*_e)||1);c[3*g+0]=Z*ke,c[3*g+1]=ge*ke,c[3*g+2]=_e*ke}let f=new Int32Array(o),u=new Float64Array(o*3),d=1;for(;d<o*2;)d<<=1;let h=d-1,_=new Int32Array(d),T=0;for(let g=0;g<o;g++){let E=3*g,b=Math.trunc(i[E+0]*s),w=Math.trunc(i[E+1]*s),S=Math.trunc(i[E+2]*s),A=(Math.imul(b,73856093)^Math.imul(w,19349663)^Math.imul(S,83492791))&h;for(;;){let C=_[A];if(C===0){let D=3*T;u[D+0]=b,u[D+1]=w,u[D+2]=S,_[A]=T+1,f[g]=T++;break}let P=3*(C-1);if(u[P+0]===b&&u[P+1]===w&&u[P+2]===S){f[g]=C-1;break}A=A+1&h}}let p=new Int32Array(T+1);for(let g=0;g<o;g++)p[f[g]+1]++;for(let g=0;g<T;g++)p[g+1]+=p[g];let m=new Int32Array(o),v=p.slice(0,T);for(let g=0;g<l;g++){let E=3*g;m[v[f[E+0]]++]=g,m[v[f[E+1]]++]=g,m[v[f[E+2]]++]=g}let x=new Float32Array(o*3);for(let g=0;g<l;g++){let E=3*g,b=c[E+0],w=c[E+1],S=c[E+2];for(let A=0;A<3;A++){let C=E+A,P=f[C],D=0,U=0,L=0;for(let G=p[P],H=p[P+1];G<H;G++){let X=3*m[G],$=c[X+0],j=c[X+1],Z=c[X+2];b*$+w*j+S*Z>a&&(D+=$,U+=j,L+=Z)}let F=1/(Math.sqrt(D*D+U*U+L*L)||1);x[3*C+0]=D*F,x[3*C+1]=U*F,x[3*C+2]=L*F}}return t.setAttribute("normal",new Ie(x,3,!1)),t}var ax={size:70,fine:26,hue:.03,sat:.08,light:.055};function xh(e,n,t=0){let r=ax,o=Ko(e,n,r.size,t^334461)*2-1,i=Ko(e+113.7,n-41.3,r.fine,t^11239)*2-1,a=.7*o+.3*i,s=Ko(e-57.1,n+89.9,r.size*1.3,t^30657)*2-1;return{hue:-r.hue*a,sat:r.sat*s,light:r.light*a}}var Ro={radius:9,crowded:6,hue:.012,sat:.04,light:.045};function Eh(e,{radius:n=Ro.radius,crowded:t=Ro.crowded}={}){let r=n,o=new Map,i=(l,c)=>l*73856093+c*19349663;e.forEach(([l,c],f)=>{let u=i(Math.floor(l/r),Math.floor(c/r)),d=o.get(u);d?d.push(f):o.set(u,[f])});let a=new Float32Array(e.length),s=n*n;return e.forEach(([l,c],f)=>{let u=Math.floor(l/r),d=Math.floor(c/r),h=0;for(let _=u-1;_<=u+1;_++)for(let T=d-1;T<=d+1;T++)for(let p of o.get(i(_,T))??[]){if(p===f)continue;let m=e[p][0]-l,v=e[p][1]-c;m*m+v*v<=s&&h++}a[f]=Math.max(0,1-h/t)}),a}function Mh(e,n){let t=n*2-1;return{hue:e.hue-Ro.hue*t,sat:e.sat+Ro.sat*t,light:e.light+Ro.light*t}}var sr={r:{oak:2.1,leaf:1.8,willow:1.9,poplar:1.3,birch:1.2,bush:1,pine:1.7,scots:1.7,spruce:1.6,column:1.1,snag:.9,beech:2.2,chestnut:2,cedar:2.3,holly:1.1,hawthorn:1.2},least:.6,most:3,needles:new Set(["pine","scots","spruce","column","cedar"]),lift:.02},Th={leaves:[1,1,1],needles:[1.12,.92,.78],soil:[.92,.9,.88]};function bh(e,n=1,t=0){let r=sr.r[e]??sr.r.leaf,o=Math.min(sr.most,Math.max(sr.least,r*n)),i=e==="snag"?"soil":sr.needles.has(e)?"needles":"leaves",a=Math.sin((t+1)*12.9898)*43758.5453;return{r:o,litter:i,turn:(a-Math.floor(a))*Math.PI*2}}function sx(e){return()=>(e=Math.imul(e,1664525)+1013904223|0,(e>>>0)/4294967296)}var $r=null;function lx(){if($r)return $r;let e=512,n=document.createElement("canvas");n.width=n.height=e;let t=n.getContext("2d"),r=sx(61447),o=e/2;for(let i=0;i<160;i++){let a=r()*Math.PI*2,s=Math.pow(r(),.7)*o*.78,l=o*(.08+r()*.16)*(1-s/o*.5),c=t.createRadialGradient(o+Math.cos(a)*s,o+Math.sin(a)*s,0,o+Math.cos(a)*s,o+Math.sin(a)*s,l),f=40+r()*22,u=.34+r()*.2;c&&(c.addColorStop(0,`rgba(${f+22},${f+10},${f-6},${u})`),c.addColorStop(1,`rgba(${f+22},${f+10},${f-6},0)`),t.fillStyle=c,t.fillRect(0,0,e,e))}for(let i=0;i<900;i++){let a=r()*Math.PI*2,s=Math.pow(r(),.85)*o*.86,l=1-Math.pow(s/(o*.86),2);if(r()>l+.15)continue;let c=r(),[f,u,d]=c<.45?[118,82,44]:c<.75?[150,112,60]:c<.9?[92,64,38]:[98,110,52],h=.8+r()*.4;t.save(),t.translate(o+Math.cos(a)*s,o+Math.sin(a)*s),t.rotate(r()*Math.PI),t.fillStyle=`rgba(${f*h},${u*h},${d*h},${.6+r()*.35})`,t.beginPath(),t.ellipse(0,0,3+r()*4,1.6+r()*2,0,0,Math.PI*2),t.fill(),t.restore()}t.lineCap="round";for(let i=0;i<70;i++){let a=r()*Math.PI*2,s=r()*o*.7,l=o+Math.cos(a)*s,c=o+Math.sin(a)*s,f=r()*Math.PI,u=6+r()*16;t.strokeStyle=`rgba(${60+r()*30},${44+r()*20},28,${.55+r()*.3})`,t.lineWidth=1+r()*1.4,t.beginPath(),t.moveTo(l,c),t.lineTo(l+Math.cos(f)*u,c+Math.sin(f)*u),t.stroke()}for(let i=0;i<6;i++){let a=i/6*Math.PI*2+r()*.6;t.strokeStyle="rgba(58,40,24,0.55)",t.lineWidth=7-i*.4,t.beginPath(),t.moveTo(o,o);let s=o*(.22+r()*.18),l=(r()-.5)*.5;t.quadraticCurveTo(o+Math.cos(a+l)*s*.6,o+Math.sin(a+l)*s*.6,o+Math.cos(a)*s,o+Math.sin(a)*s),t.stroke()}return $r=new ho(n),$r.colorSpace=Dr,$r.anisotropy=4,$r}var cx={pc:{seg:20,rings:[0,.35,.7,1]},phone:{seg:12,rings:[0,.5,1]}};function wh(e,n,{phone:t=Ot}={}){if(!e.length)return null;let{seg:r,rings:o}=cx[t?"phone":"pc"],i=1+r*(o.length-1),a=new Float32Array(e.length*i*3),s=new Float32Array(e.length*i*2),l=new Float32Array(e.length*i*3),c=[];e.forEach((_,T)=>{let p=bh(_.kind,_.width,_.seed),m=Th[p.litter],v=T*i,x=(g,E,b,w,S)=>{a.set([E,n(E,b)+sr.lift,b],(v+g)*3),s.set([w,S],(v+g)*2),l.set(m,(v+g)*3)};x(0,_.x,_.z,.5,.5);for(let g=1;g<o.length;g++)for(let E=0;E<r;E++){let b=E/r*Math.PI*2,w=o[g]*p.r;x(1+(g-1)*r+E,_.x+Math.cos(b)*w,_.z+Math.sin(b)*w,.5+Math.cos(b+p.turn)*o[g]*.5,.5+Math.sin(b+p.turn)*o[g]*.5)}for(let g=0;g<r;g++)c.push(v,v+1+(g+1)%r,v+1+g);for(let g=1;g<o.length-1;g++){let E=v+1+(g-1)*r,b=E+r;for(let w=0;w<r;w++){let S=(w+1)%r;c.push(E+w,E+S,b+w,b+w,E+S,b+S)}}});let f=new xt;f.setAttribute("position",new Ie(a,3)),f.setAttribute("uv",new Ie(s,2)),f.setAttribute("color",new Ie(l,3)),f.setIndex(c),f.computeVertexNormals();let u=f.attributes.normal;for(let _=0;_<u.count;_++)u.getY(_)<0&&u.setXYZ(_,-u.getX(_),-u.getY(_),-u.getZ(_));let d=zn(Ml(new En({map:lx(),vertexColors:!0,transparent:!0,depthWrite:!1}),Dt.wear),"ground"),h=new yt(f,d);return h.name="tree feet",h.renderOrder=-10+Dt.wear,h.receiveShadow=!0,h}var cr=null,yh=typeof fetch=="function"&&typeof location<"u"&&/^https?:$/.test(location.protocol)?fetch("/api/bakes").then(e=>e.ok?e.json():null).then(e=>{cr=typeof e?.stamp=="string"?e.stamp:null}).catch(()=>{}):Promise.resolve();function T2(){return!!cr}function Di(e,n=!1){let t=r=>n?r.slice():r;return{attributes:Object.entries(e.attributes).map(([r,o])=>[r,t(o.array),o.itemSize,!!o.normalized]),index:e.index?t(e.index.array):null,groups:e.groups.map(r=>({...r})),drawRange:[e.drawRange.start,e.drawRange.count],sphere:!!e.boundingSphere,box:!!e.boundingBox}}function wl(e){let n=new xt;for(let[t,r,o,i]of e.attributes)n.setAttribute(t,new Ie(r,o,i));e.index&&n.setIndex(new Ie(e.index,1));for(let t of e.groups??[])n.addGroup(t.start,t.count,t.materialIndex);return e.drawRange&&n.setDrawRange(e.drawRange[0],e.drawRange[1]),e.box&&n.computeBoundingBox(),e.sphere&&n.computeBoundingSphere(),n}var fx=e=>e?.isBufferGeometry?Di(e):e,ux=e=>io(e??null,{as:fx});function Li(e){if(e===null||typeof e!="object")return e;if(ArrayBuffer.isView(e))return e.slice();if(Array.isArray(e))return e.map(Li);let n={};for(let[t,r]of Object.entries(e))n[t]=Li(r);return n}var yo=class{constructor(n,t=new Map){this.key=n,this.kept=t,this.used=new Map,this.made=new Map,this.hits=0,this.misses=0,this.first=!1,this.ms=0}partKey(n,t){return`${n}:${ux(t)}`}take(n){let t=this.used.get(n)??this.made.get(n)??this.kept.get(n);if(t!==void 0)return this.made.has(n)||this.used.set(n,t),Li(t)}has(n,t){let r=this.partKey(n,t);return this.made.has(r)||this.used.has(r)||this.kept.has(r)}geometry(n,t,r,{keep:o=null}={}){let i=performance.now(),a=this.partKey(n,t),s=this.take(a);if(this.ms+=performance.now()-i,s)return this.hits++,wl(s);let l=r();if(this.misses++,o&&!o())return l;let c=performance.now();return this.made.set(a,Di(l,!0)),this.ms+=performance.now()-c,l}find(n,t){let r=performance.now(),o=this.take(this.partKey(n,t));return this.ms+=performance.now()-r,o!==void 0&&this.hits++,o}keep(n,t,r){this.keepAt(this.partKey(n,t),r)}keepAt(n,t){if(t==null)return;let r=performance.now();this.made.set(n,Li(t)),this.ms+=performance.now()-r,this.misses++}get changed(){return this.made.size>0}entries(){return new Map([...this.used,...this.made])}bytes(){return Bc(this.entries())}summary(){return{hits:this.hits,misses:this.misses,ms:Math.round(this.ms)}}};async function Ch(e,n){await yh;let t=cr&&n?ua(cr,e,n):null;if(!t)return null;try{let r=await fetch(`/api/bakes/${t}`);return r.ok?new yo(t,Gc(await r.arrayBuffer())):new yo(t)}catch(r){return console.warn("Couldn't read the kept hole; building it afresh:",r?.message??r),new yo(t)}}function b2(e,n){return cr&&n?ua(cr,e,n):null}async function w2(){if(await yh,!cr)return null;try{let e=await fetch("/api/bakes?names=1");if(!e.ok)return null;let n=await e.json();return Array.isArray(n?.names)?new Set(n.names):null}catch{return null}}var Ah=!1,lr=null,bl=typeof Worker>"u",dx=1,Kr=new Map;function hx(){if(bl)return null;if(lr)return lr;try{lr=new Worker(new URL("../bakeworker.js",import.meta.url),{type:"module"})}catch{return bl=!0,null}return lr.onmessage=({data:e})=>{let n=Kr.get(e.id);Kr.delete(e.id),n?.(e)},lr.onerror=()=>{bl=!0,lr=null;for(let e of Kr.values())e({error:"the worker stopped"});Kr.clear()},lr}function Ph(e,n=new Set){if(!e||typeof e!="object")return n;if(ArrayBuffer.isView(e))return e.buffer instanceof ArrayBuffer&&n.add(e.buffer),n;for(let t of e instanceof Map?e.values():Object.values(e))Ph(t,n);return n}var px=(e,n=!1)=>`/api/bakes/${e}${n?"?first=1":""}`;async function Lh(e){if(!e?.changed)return 0;let n=r=>(Ah||console.warn("Couldn't keep the hole for next time:",r?.message??r),Ah=!0,0),t=hx();if(t){let r=e.entries(),o=dx++,i=new Promise(s=>Kr.set(o,s));try{t.postMessage({id:o,key:e.key,first:e.first,entries:r,back:mx},[...Ph(r)])}catch(s){return Kr.delete(o),n(s)}let a=await i;return a.error?n(new Error(a.error)):a.data?Rh(e,a.data,n):a.bytes}return Rh(e,e.bytes(),n)}var mx=typeof window<"u"&&!!window.pocket;async function Rh(e,n,t){try{let r=await fetch(px(e.key,e.first),{method:"PUT",headers:{"Content-Type":"application/octet-stream"},body:new Blob([n])});if(!r.ok)throw new Error(`the server said ${r.status}`);return n.byteLength}catch(r){return t(r)}}function A2(e,n={}){if(!e)return null;try{return io({site:e,...n})}catch{return null}}function Dh(e,n,t,r,o){let i=Math.max(0,Math.floor(o));if(!i||t<=2*i||r<=2*i)return n;let a=e===n?e.slice():e,s=new Int32Array(t*r);for(let l=0;l<r;l++){let c=l*t,f=0;for(let u=0;u<2*i;u++)a[(c+u)*4+3]>=200&&f++;for(let u=i;u<t-i;u++)a[(c+u+i)*4+3]>=200&&f++,s[c+u]=f,a[(c+u-i)*4+3]>=200&&f--}for(let l=i;l<r-i;l++)for(let c=i;c<t-i;c++){let f=(l*t+c)*4;if(a[f+3]>16)continue;let u=0;for(let T=-i;T<=i;T++)u+=s[(l+T)*t+c];if(!u)continue;let d=0,h=0,_=0;for(let T=-i;T<=i;T++)for(let p=-i;p<=i;p++){let m=((l+T)*t+(c+p))*4;a[m+3]<200||(d+=a[m],h+=a[m+1],_+=a[m+2])}n[f]=d/u,n[f+1]=h/u,n[f+2]=_/u,n[f+3]=32}return n}var Co={near:3.5,close:6,apart:.36,out:1.06,radius:[.42,.58],droop:.3,wave:.3,up:.4,under:-.6,over:1,fresh:.3,freshTint:[1,1,.74]},Al=6;function Uh(e,n,t,r=Co){let o=[];for(let[m,v,x,g]of e){let E=Math.max(12,Math.round(g*g*10));for(let b=0;b<E;b++){let w=r.under+((r.over??1)-r.under)*((b+n())/E),S=b*2.39996+n()*.8,A=Math.sqrt(Math.max(0,1-w*w)),C=[A*Math.cos(S),w,A*Math.sin(S)],P=[m+C[0]*g*r.out,v+C[1]*g*r.out,x+C[2]*g*r.out];e.some(([D,U,L,F])=>(D!==m||U!==v||L!==x)&&Math.hypot(P[0]-D,P[1]-U,P[2]-L)<F*1.02)||o.push({at:P,dir:C,r:g,pick:n()})}}o.sort((m,v)=>m.pick-v.pick);let i=[];for(let m of o){if(i.length>=t)break;i.every(v=>Math.hypot(v.at[0]-m.at[0],v.at[1]-m.at[1],v.at[2]-m.at[2])>=r.apart*Math.min(v.r,m.r))&&i.push(m)}if(!i.length)return null;let a=[],s=[],l=[],c=[],f=[],u=new te,d=new te,h=new te,_=new te,T=new te;for(let{at:m,dir:v,r:x}of i){let g=x*(r.radius[0]+n()*(r.radius[1]-r.radius[0])),E=n()*Math.PI*2,b=.86+n()*.14;u.set(v[0],v[1]+r.up,v[2]).normalize(),d.set(0,1,0),Math.abs(u.y)>.92&&d.set(1,0,0),d.cross(u).normalize(),h.crossVectors(u,d);let w=a.length/3;a.push(m[0],m[1],m[2]),s.push(u.x,u.y,u.z),l.push(.5,.5);let S=((w+1)*2654435761>>>0)/4294967296<(r.fresh??0),[A,C,P]=S?r.freshTint:[b,b,b];c.push(A,C,P);for(let D=0;D<Al;D++){let U=E+D/Al*Math.PI*2,[L,F]=[Math.cos(U),Math.sin(U)],G=r.droop*g*(1+(D%2?r.wave:-r.wave));_.set(m[0],m[1],m[2]).addScaledVector(d,L*g).addScaledVector(h,F*g).addScaledVector(u,-G),T.copy(u).addScaledVector(d,L*.6).addScaledVector(h,F*.6).normalize(),a.push(_.x,_.y,_.z),s.push(T.x,T.y,T.z),l.push(.5+.5*L,.5+.5*F),c.push(A*.9,C*.9,P*.9),f.push(w,w+1+D,w+1+(D+1)%Al)}}let p=new xt;return p.setAttribute("position",new Ie(new Float32Array(a),3)),p.setAttribute("normal",new Ie(new Float32Array(s),3)),p.setAttribute("uv",new Ie(new Float32Array(l),2)),p.setAttribute("color",new Ie(new Float32Array(c),3)),p.setIndex(f),p}var Rl=(e,n=1)=>`rgb(${e*.42*n|0},${e*.7*n|0},${e*.3*n|0})`,Ih=e=>`rgb(${e*.6|0},${Math.min(255,e*.95)|0},${e*.42|0})`,Ui=(e,n=0)=>`rgb(${e*(.38-n*.08)|0},${e*.7|0},${e*(.3+n*.22)|0})`,gx={leaves:26,len:[34,50],wide:.44,spines:4,spine:.3,berries:4,berry:4.4},_x={leaves:46,len:[17,27],lobes:3},vx={sprays:7,leaves:7,len:[24,34],wide:.3},Sx={twigs:9,needles:30,len:[7,11]},xx={tufts:11,needles:22,len:[26,40]},Ex={sprays:6,rosettes:9,needles:9,len:[7,10],cones:3};function Po(e,n,t,r,o,i){let a=[];for(let s=0;s<e;s++){let l=t()*Math.PI*2,c=n*r*Math.sqrt(t());a.push([n/2+Math.cos(l)*c,n/2+Math.sin(l)*c,t()*Math.PI*2,o+t()*(i-o)])}return a.sort((s,l)=>s[3]-l[3])}function Mx(e,n,t,{dilate:r}){let o=gx,i=(s,l,c,f,u)=>{let d=f*o.wide;e.save(),e.translate(s,l),e.rotate(c);let h=T=>{let p=[];for(let m=0;m<=o.spines;m++){let v=(m+.5)/(o.spines+.5),x=Math.sin(Math.min(1,v*.98)*Math.PI)*.9+.1;p.push([f*(v-.5/(o.spines+.5))*.94,T*d*x*(1-o.spine)]),p.push([f*v*.94,T*d*x*(1+o.spine)])}return p},_=()=>{e.beginPath(),e.moveTo(0,0);for(let[T,p]of h(1))e.lineTo(T,p);e.lineTo(f,0);for(let[T,p]of h(-1).reverse())e.lineTo(T,p);e.closePath()};e.save(),e.globalCompositeOperation="source-atop",e.translate(f*.05,f*.06),_(),e.fillStyle="rgba(10,22,10,0.3)",e.fill(),e.restore(),_(),e.fillStyle=Rl(u,.9),e.fill(),e.save(),e.globalCompositeOperation="source-atop",e.fillStyle=`rgba(${Math.min(255,u*1.25)|0},${Math.min(255,u*1.5)|0},${Math.min(255,u*1.05)|0},0.4)`,e.beginPath(),e.ellipse(f*.5,-d*.3,f*.3,d*.16,0,0,Math.PI*2),e.fill(),e.strokeStyle=`rgba(${u*.9|0},${Math.min(255,u*1.15)|0},${u*.5|0},0.9)`,e.lineWidth=Math.max(.6,f*.028),e.beginPath(),e.moveTo(f*.04,0),e.lineTo(f*.95,0),e.stroke(),e.restore(),e.restore()},a=Po(o.leaves,n,t,.36,92,168);for(let[s,l,c,f]of a)i(s,l,c,o.len[0]+t()*(o.len[1]-o.len[0]),f);for(let s=0;s<o.berries;s++){let l=t()*Math.PI*2,c=n*.3*Math.sqrt(t()),f=n/2+Math.cos(l)*c,u=n/2+Math.sin(l)*c,d=3+Math.floor(t()*3);for(let h=0;h<d;h++){let _=f+(t()-.5)*o.berry*2.4,T=u+(t()-.5)*o.berry*2.4,p=o.berry*(.8+t()*.35);e.fillStyle="rgb(150,14,18)",e.beginPath(),e.arc(_+p*.12,T+p*.14,p,0,Math.PI*2),e.fill(),e.fillStyle="rgb(255,52,40)",e.beginPath(),e.arc(_,T,p*.88,0,Math.PI*2),e.fill(),e.fillStyle="rgba(255,225,215,0.85)",e.beginPath(),e.arc(_-p*.3,T-p*.32,p*.26,0,Math.PI*2),e.fill()}}r(e,2)}function Tx(e,n,t,{dilate:r}){let o=_x,i=(a,s,l,c,f)=>{e.save(),e.translate(a,s),e.rotate(l);let u=o.lobes+Math.floor(t()*2),d=()=>{e.beginPath(),e.moveTo(0,0);let h=44;for(let _=0;_<=h;_++){let T=-1+2*_/h,p=T*1.95,m=Math.pow(Math.abs(Math.cos(T*u*Math.PI*.5)),.55),v=c*(.34+.66*m)*(.62+.38*Math.cos(p*.5));e.lineTo(c*.18+Math.cos(p)*v*.82,Math.sin(p)*v*.82)}e.closePath()};e.save(),e.globalCompositeOperation="source-atop",e.translate(c*.06,c*.07),d(),e.fillStyle="rgba(18,30,12,0.24)",e.fill(),e.restore(),d(),e.fillStyle=Rl(f),e.fill(),e.save(),e.translate(c*.3,0),e.scale(.55,.5),e.translate(-c*.18,0),d(),e.fillStyle=Ih(f),e.fill(),e.restore(),e.strokeStyle=`rgba(${f*.75|0},${Math.min(255,f)|0},${f*.35|0},0.8)`,e.lineWidth=Math.max(.5,c*.035),e.beginPath(),e.moveTo(-c*.12,0),e.lineTo(c*.78,0),e.stroke(),e.restore()};for(let[a,s,l,c]of Po(o.leaves,n,t,.39,100,178))i(a,s,l,o.len[0]+t()*(o.len[1]-o.len[0]),c);r(e,1)}function bx(e,n,t,{dilate:r}){let o=vx,i=(s,l,c,f,u)=>{let d=f*o.wide;e.save(),e.translate(s,l),e.rotate(c);let h=()=>{e.beginPath(),e.moveTo(0,0);let _=16;for(let T=1;T<=_;T++)e.lineTo(T/_*f,d*Math.pow(Math.sin(T/_*Math.PI),.8)*(1-.25*(T/_)));for(let T=_;T>=0;T--)e.lineTo(T/_*f,-d*Math.pow(Math.sin(T/_*Math.PI),.8)*(1-.25*(T/_)));e.closePath()};e.save(),e.globalCompositeOperation="source-atop",e.translate(f*.05,f*.06),h(),e.fillStyle="rgba(18,30,12,0.22)",e.fill(),e.restore(),h(),e.fillStyle=Rl(u),e.fill(),e.save(),e.translate(f*.15,0),e.scale(.7,.55),h(),e.fillStyle=Ih(u),e.fill(),e.restore(),e.save(),e.globalCompositeOperation="source-atop",e.strokeStyle=`rgba(${u*.34|0},${u*.56|0},${u*.24|0},0.5)`,e.lineWidth=Math.max(.35,f*.014),e.beginPath();for(let _=1;_<=7;_++){let T=_/8.5;for(let p of[-1,1])e.moveTo(f*T,0),e.lineTo(f*(T+.1),p*d*.9*Math.sin((T+.1)*Math.PI))}e.stroke(),e.strokeStyle=`rgba(${u*.78|0},${Math.min(255,u*1.02)|0},${u*.36|0},0.85)`,e.lineWidth=Math.max(.5,f*.024),e.beginPath(),e.moveTo(0,0),e.lineTo(f*.95,0),e.stroke(),e.restore(),e.restore()},a=Po(o.sprays,n,t,.2,100,172);for(let[s,l,c,f]of a){let u=n*(.26+t()*.1);e.strokeStyle="rgb(92,74,52)",e.lineWidth=1.4,e.beginPath(),e.moveTo(s,l),e.lineTo(s+Math.cos(c)*u,l+Math.sin(c)*u),e.stroke();for(let d=o.leaves-1;d>=0;d--){let h=(d+.6)/o.leaves,_=d%2?1:-1,T=(o.len[0]+t()*(o.len[1]-o.len[0]))*(1-.3*h);i(s+Math.cos(c)*u*h,l+Math.sin(c)*u*h,c+_*(.75+t()*.2)*(d===o.leaves-1?.15:1),T,f*(.92+t()*.16))}}r(e,2)}function wx(e,n,t,{dilate:r}){let o=Sx,i=[];for(let a=0;a<o.twigs;a++)i.push([n*(.16+.68*((a+t()*.6)/o.twigs)),n*(.14+t()*.2),Math.PI/2+(t()-.5)*.5,n*(.42+t()*.22),78+t()*62]);i.sort((a,s)=>a[4]-s[4]);for(let[a,s,l,c,f]of i){e.strokeStyle="rgb(84,62,40)",e.lineWidth=1.6,e.beginPath(),e.moveTo(a,s),e.lineTo(a+Math.cos(l)*c,s+Math.sin(l)*c),e.stroke();for(let u=0;u<=o.needles;u++){let d=u/o.needles,h=a+Math.cos(l)*c*d,_=s+Math.sin(l)*c*d,T=(o.len[0]+t()*(o.len[1]-o.len[0]))*(1-.35*d);for(let p of[-1,1]){let m=l+p*(1+t()*.45),v=f+(t()-.5)*34;e.strokeStyle=Ui(v,.5),e.lineWidth=2.2,e.beginPath(),e.moveTo(h,_),e.lineTo(h+Math.cos(m)*T,_+Math.sin(m)*T),e.stroke()}}e.strokeStyle=Ui(f+70,.2),e.lineWidth=3,e.beginPath(),e.moveTo(a+Math.cos(l)*c*.94,s+Math.sin(l)*c*.94),e.lineTo(a+Math.cos(l)*c*1.04,s+Math.sin(l)*c*1.04),e.stroke()}r(e,1)}function Ax(e,n,t,{dilate:r}){let o=xx;for(let[i,a,s,l]of Po(o.tufts,n,t,.33,86,150)){e.strokeStyle="rgb(120,84,52)",e.lineWidth=1.8,e.beginPath(),e.moveTo(i,a),e.lineTo(i-Math.cos(s)*16,a-Math.sin(s)*16),e.stroke();for(let c=0;c<o.needles;c++){let f=s+(t()-.5)*3.6,u=o.len[0]+t()*(o.len[1]-o.len[0]),d=l+(t()-.5)*40;e.strokeStyle=Ui(d,1),e.lineWidth=1.9,e.beginPath(),e.moveTo(i,a),e.quadraticCurveTo(i+Math.cos(f)*u*.5+(t()-.5)*4,a+Math.sin(f)*u*.5+(t()-.5)*4,i+Math.cos(f)*u,a+Math.sin(f)*u),e.stroke()}}r(e,1)}function Rx(e,n,t,{dilate:r}){let o=Ex,i=[];for(let[a,s,l,c]of Po(o.sprays,n,t,.12,84,140)){let f=n*(.3+t()*.1);e.strokeStyle="rgb(96,72,50)",e.lineWidth=2,e.beginPath(),e.moveTo(a,s),e.lineTo(a+Math.cos(l)*f,s+Math.sin(l)*f),e.stroke();for(let u=0;u<o.rosettes;u++){let d=(u+.7)/o.rosettes,h=u%2?1:-1,_=(6+t()*9)*(1-.4*d),T=a+Math.cos(l)*f*d+Math.cos(l+h*1.25)*_,p=s+Math.sin(l)*f*d+Math.sin(l+h*1.25)*_;e.strokeStyle="rgb(96,72,50)",e.lineWidth=1.1,e.beginPath(),e.moveTo(a+Math.cos(l)*f*d,s+Math.sin(l)*f*d),e.lineTo(T,p),e.stroke();let m=c+(t()-.5)*36;for(let v=0;v<o.needles;v++){let x=v/o.needles*Math.PI*2+t()*.5,g=o.len[0]+t()*(o.len[1]-o.len[0]);e.strokeStyle=Ui(m+(t()-.5)*24,.85),e.lineWidth=1.8,e.beginPath(),e.moveTo(T,p),e.lineTo(T+Math.cos(x)*g,p+Math.sin(x)*g),e.stroke()}i.length<o.cones&&t()<.1&&i.push([T,p])}}for(let[a,s]of i){e.fillStyle="rgb(150,160,120)",e.beginPath(),e.ellipse(a,s-9,6.5,10,0,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(96,104,72,0.9)",e.lineWidth=.9;for(let l=-2;l<=2;l++)e.beginPath(),e.moveTo(a-6,s-9+l*3.4),e.lineTo(a+6,s-9+l*3.4),e.stroke()}r(e,1)}var fr={holly:{paint:Mx,seed:53,needles:!1},hawthorn:{paint:Tx,seed:59,needles:!1},beech:{paint:bx,seed:61,needles:!1},spruce:{paint:wx,seed:71,needles:!0},scots:{paint:Ax,seed:73,needles:!0},cedar:{paint:Rx,seed:79,needles:!0}};var Lo={samples:64,cover:.85,seen:.12,planes:3,size:2.1,tiles:2,tile:3,shade:.55,buried:.8},yl=new Map;function yx(e){if(!yl.has(e)){let n=[];for(let t=0;t<e;t++){let r=1-2*(t+.5)/e,o=Math.sqrt(1-r*r),i=t*2.399963229728653;n.push([Math.cos(i)*o,r,Math.sin(i)*o])}yl.set(e,n)}return yl.get(e)}function Cx(e,n,t,r){let o=t[3]*r,i=e[0]-t[0],a=e[1]-t[1],s=e[2]-t[2],l=i*n[0]+a*n[1]+s*n[2],c=i*i+a*a+s*s-o*o;return c<=0?!0:l<0&&l*l-c>0}function Px(e,n=Lo){let t=yx(n.samples);return e.map((r,o)=>{let i=0;for(let a of t){let s=[r[0]+a[0]*r[3],r[1]+a[1]*r[3],r[2]+a[2]*r[3]],l=!1;for(let c=0;c<e.length&&!l;c++)c!==o&&Cx(s,a,e[c],n.cover)&&(l=!0);l||i++}return i/t.length})}function Nh(e,n=Lo){let t=Px(e,n),r=[],o=[];return t.forEach((i,a)=>(i>=n.seen?r:o).push(a)),{seen:r,heart:o,shares:t}}function Oh(e,n,t,r,o,i=Lo){for(let a=0;a<e.length;a++){if(a===n)continue;let s=e[a],l=s[3]*i.buried,c=t-s[0],f=r-s[1],u=o-s[2];if(c*c+f*f+u*u<l*l)return!0}return!1}var Je=e=>Number(e).toFixed(3),Io=qs.bark,pn=qs.leaves;function Ne(e){return()=>{e|=0,e=e+1831565813|0;let n=Math.imul(e^e>>>15,1|e);return n=n+Math.imul(n^n>>>7,61|n)^n,((n^n>>>14)>>>0)/4294967296}}function Dl(e,n,t){let r=e.attributes.position,o=new Map;for(let i=0;i<r.count;i++){let a=`${r.getX(i).toFixed(3)},${r.getY(i).toFixed(3)},${r.getZ(i).toFixed(3)}`;o.has(a)||o.set(a,[(t()-.5)*n,(t()-.5)*n,(t()-.5)*n]);let[s,l,c]=o.get(a);r.setXYZ(i,r.getX(i)+s,r.getY(i)+l,r.getZ(i)+c)}return e.computeVertexNormals(),e}function Lx(e,n,t,r=12,o=!1){let i=(o?[[.12,-n*.28],[e,-n*.46],[e*.45,n*.06],[.001,n*.5]]:[[.12,-n*.28],[e*.45,-n*.4],[e*.88,-n*.5],[e,-n*.46],[e*.62,-n*.1],[e*.3,n*.22],[.001,n*.5]]).map(([c,f])=>new je(c,f)),a=new Ss(i,r).toNonIndexed(),s=Array.from({length:r+1},()=>.8+t()*.35);s[r]=s[0];let l=a.attributes.position;for(let c=0;c<l.count;c++){let f=l.getX(c),u=l.getZ(c),h=(Math.atan2(f,u)+Math.PI*2)%(Math.PI*2)/(Math.PI*2)*r,_=Math.floor(h),T=h-_,p=s[_]*(1-T)+s[(_+1)%r]*T,m=Math.min(1,Math.hypot(f,u)/e),v=1+(p-1)*m;l.setXYZ(c,f*v,l.getY(c)-(p-1)*m*n*.25,u*v)}return a.computeVertexNormals(),a}function Ul(e,n,t=12,r=!1){let o=Ge(e.map(([l,c,f,u,d])=>{let h=Lx(l,c,n,t,r);h.scale(.88+n()*.24,1,.88+n()*.24),h.rotateY(n()*Math.PI),h.translate(u,f,d),Dl(h,.25,n),h.deleteAttribute("normal"),h.deleteAttribute("uv");let _=Tl(h,.001);return _.computeVertexNormals(),_.toNonIndexed()})),i=sn(o,e.length*3,n,{low:1,high:10}),a=i.attributes.normal,s=i.attributes.color;for(let l=0;l<s.count;l++){let c=1-Dx*Math.max(0,-a.getY(l));s.setXYZ(l,s.getX(l)*c,s.getY(l)*c,s.getZ(l)*c)}return i}var Dx=.45,Jh=.75;function Wi(e,n,t=!0,r=2,o=null,i=r){let a=Ge(e.map(([s,l,c,f])=>{let u=new di(f,r),d=[.85+n()*.3,.8+n()*.3,.85+n()*.3];u.scale(...d);let h=i!==r?(Dl(new di(f,i),.35,n),Ne(Math.round((s*31+l*17+c*13+f*7)*1e3)>>>0)):n,_=u.attributes.position;for(let p=0;p<_.count;p++)_.getY(p)<0&&_.setY(p,_.getY(p)*Jh);if(o&&u.scale(o.across,o.up,o.across),u.translate(s,l,c),Dl(u,.35,h),!t)return u;u.deleteAttribute("normal"),u.deleteAttribute("uv");let T=Tl(u,.001);return T.computeVertexNormals(),T.toNonIndexed()}));return Ix(sn(a,e.length,n,{low:3,high:8}),e)}var Ux=.8;function Ix(e,n,t=Ux){let r=e.attributes.normal;if(!r||n.length<2||t<=0)return e;let o=e.attributes.position,[i,a,s,l]=[0,0,0,0];for(let[u,d,h,_]of n){let T=_*_*_;i+=u*T,a+=d*T,s+=h*T,l+=T}let c=new te,f=new te;for(let u=0;u<o.count;u++)c.set(o.getX(u)-i/l,o.getY(u)-a/l,o.getZ(u)-s/l).normalize(),f.set(r.getX(u),r.getY(u),r.getZ(u)).lerp(c,t).normalize(),r.setXYZ(u,f.x,f.y,f.z);return e}function ep(e,n){return tp($l(e,n),e.width,e.height)}function $l(e,n){let{width:t,height:r}=e,o=e.getContext("2d").getImageData(0,0,t,r).data,[i,a,s]=Ox(o,n),l=new Uint8Array(t*r*4);for(let c=0;c<r;c++){let f=(r-1-c)*t*4,u=c*t*4;for(let d=0;d<t*4;d+=4){let h=o[f+d+3],_=h>=Nx;l[u+d]=_?o[f+d]:i,l[u+d+1]=_?o[f+d+1]:a,l[u+d+2]=_?o[f+d+2]:s,l[u+d+3]=h}}return l}function tp(e,n,t){let r=new Gn(e,n,t,Jt);return r.colorSpace=Dr,r.magFilter=St,r.minFilter=$t,r.generateMipmaps=!0,r.anisotropy=4,r.needsUpdate=!0,r}var Nx=8;function Ox(e,n){let t=0,r=0,o=0,i=0;for(let a=0;a<e.length;a+=4)e[a+3]<200||(t+=e[a],r+=e[a+1],o+=e[a+2],i++);return i?[Math.round(t/i),Math.round(r/i),Math.round(o/i)]:n}function np(e,n="cards",t=[1,1]){let r=new En({side:Qt,alphaTest:.45,...e}),o=`#define LEAF_GRID vec2(${(14*t[0]).toFixed(1)}, ${(14*t[1]).toFixed(1)})`;return r.onBeforeCompile=i=>{i.fragmentShader=i.fragmentShader.replace("#include <normal_fragment_begin>",`#include <normal_fragment_begin>
  normal = normalize( vNormal );`),Ce&&(i.fragmentShader=Bx(i.fragmentShader.replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
        ${rp}`),Hx),Ot||(i.fragmentShader=i.fragmentShader.replace("#include <map_fragment>",`#include <map_fragment>
${Gx}`).replace("#include <common>",`#include <common>
${o}`)))},r.customProgramCacheKey=()=>Ce?`foliage-v7-close-${t[0]}x${t[1]}${Ot?"-p":""}`:"foliage-v1",zn(r,n),on(r,"foliage",{kind:n,high:Ce,grid:t})}var Fx=.07,rp=Ot?"float fNear = 0.0;":`float fNear = 1.0 - smoothstep(${Je(pn.full)}, ${Je(pn.fade)}, length(vViewPosition));`,Hx=`
		{
			float fBack = max( dot( -geometryViewDir, directLight.direction ), 0.0 );
			float fLobe = fBack * fBack;
			fLobe *= fLobe;
			reflectedLight.directDiffuse += diffuseColor.rgb * vec3( 1.0, 1.0, 0.8 ) * directLight.color * ( ( ${Je(Fx)} + ${Je(pn.through)} * fNear ) * fLobe );
			if ( fNear > 0.0 ) {
				// The sun on the leaf's back comes through it; and a waxy glint.
				float fThrough = max( -dot( normal, directLight.direction ), 0.0 );
				float fGlint = pow( max( dot( reflect( -directLight.direction, normal ), geometryViewDir ), 0.0 ), 36.0 );
				reflectedLight.directDiffuse += directLight.color * fNear * ( diffuseColor.rgb * vec3( 1.0, 1.0, 0.75 ) * ${Je(pn.behind)} * fThrough + mix( diffuseColor.rgb, vec3( 1.0 ), 0.4 ) * ${Je(pn.glint)} * fGlint );
			}
		}`,Fh=!1;function Bx(e,n){let t=Pe.lights_fragment_begin,r="RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );",o=t.indexOf("DirectionalLight directionalLight;"),i=o<0?-1:t.indexOf(r,o);if(i<0)return Fh||console.warn("Light through the leaves: three.js's lighting isn't as expected; none."),Fh=!0,e;let a=i+r.length;return e.replace("#include <lights_fragment_begin>",`${t.slice(0,a)}
${n}${t.slice(a)}`)}var Gx=`#ifdef USE_MAP
        {
          ${rp}
          // (Gone where a leaf's patch is smaller than a few pixels, where
          // it was only sparkle that changed every frame.)
          float fSmall = 1.0 - smoothstep(0.25, 0.5, length(fwidth(vMapUv * LEAF_GRID)));
          if (fNear * fSmall > 0.0) {
            vec2 fCell = floor(vMapUv * LEAF_GRID);
            float fH = fract(sin(dot(fCell, vec2(12.9898, 78.233))) * 43758.5453);
            diffuseColor.rgb *= mix(vec3(1.0), vec3(1.0 - ${Je(pn.shade/2)} + ${Je(pn.shade)} * fH, 1.0 - ${Je(pn.shade/2.5)} + ${Je(pn.shade*.8)} * fH, 1.0 - ${Je(pn.shade/2)} + ${Je(pn.shade*.6)} * (1.0 - fH)), fNear * fSmall);
          }
        }
        #endif`,mn=(At?4:2)/(Ot?2:1);function Uo(e,n,t,r,o,i,a,s){e.save(),e.translate(n,t),e.rotate(r);let l=22,c=()=>{e.beginPath(),e.moveTo(0,0);for(let f=1;f<=l;f++){let u=f/l,d=Math.sin(u*Math.PI),h=a?.7+.3*Math.max(0,Math.sin(u*a*Math.PI)):1;e.lineTo(u*o,i*d*h)}for(let f=l;f>=0;f--){let u=f/l,d=Math.sin(Math.max(u,.001)*Math.PI),h=a?.7+.3*Math.max(0,Math.sin(u*a*Math.PI)):1;e.lineTo(u*o,-i*d*h)}e.closePath()};e.save(),e.globalCompositeOperation="source-atop",e.translate(o*.05,o*.06),c(),e.fillStyle=`rgba(18,30,12,${Il.shade})`,e.fill(),e.restore(),c(),e.fillStyle=`rgb(${s*.42|0},${s*.7|0},${s*.3|0})`,e.fill(),e.fillStyle=`rgb(${s*.6|0},${s*.95|0},${s*.42|0})`,e.save(),e.translate(o*.14,0),e.scale(.66,.5),e.fill(),e.restore(),e.strokeStyle=`rgba(${Math.min(255,s*.75)|0},${Math.min(255,s)|0},${s*.35|0},0.8)`,e.lineWidth=Math.max(.45,o*.02),e.beginPath(),e.moveTo(o*.08,0),e.lineTo(o*.88,0),e.stroke(),e.globalCompositeOperation="source-atop",e.lineWidth=Math.max(.3,o*.011),e.beginPath();for(let f of Il.veins){let u=i*Math.sin(f*Math.PI)*.62;for(let d of[-1,1])e.moveTo(o*f,0),e.lineTo(o*(f+.11),d*u)}e.stroke(),e.restore()}var Il={shade:.22,veins:[.28,.46,.64]};function Hh(e,n){let t=op,r=(i,a,s)=>{let c=u=>a*(u<t.widest?Math.pow(u/t.widest,1.35):Math.pow(Math.max(0,(1-u)/(1-t.widest)),.55)),f=()=>{e.beginPath(),e.moveTo(0,0);for(let u=1;u<=18;u++)e.lineTo(u/18*i,c(u/18));for(let u=18;u>=0;u--)e.lineTo(u/18*i,-c(u/18));e.closePath()};e.save(),e.globalCompositeOperation="source-atop",e.translate(i*.04,i*.05),f(),e.fillStyle=`rgba(18,30,12,${Il.shade})`,e.fill(),e.restore(),f(),e.fillStyle=`rgb(${s*.42|0},${s*.7|0},${s*.3|0})`,e.fill(),e.save(),e.translate(i*.16,0),e.scale(.72,.52),f(),e.fillStyle=`rgb(${s*.6|0},${s*.95|0},${s*.42|0})`,e.fill(),e.restore(),e.save(),e.globalCompositeOperation="source-atop",e.strokeStyle=`rgba(${Math.min(255,s*.78)|0},${Math.min(255,s*1.02)|0},${s*.36|0},0.85)`,e.lineWidth=Math.max(.5,i*.022),e.beginPath(),e.moveTo(0,0),e.lineTo(i*.94,0),e.stroke(),e.strokeStyle=`rgba(${s*.3|0},${s*.5|0},${s*.2|0},0.45)`,e.lineWidth=Math.max(.35,i*.011),e.beginPath();for(let u=0;u<t.ribs;u++){let d=.2+u/t.ribs*.68;for(let h of[-1,1])e.moveTo(i*d,0),e.lineTo(i*(d+.09),h*c(d+.09)*.86)}e.stroke(),e.restore()};return(i,a,s,l,c)=>{e.save(),e.translate(i,a),e.rotate(s),e.strokeStyle=`rgb(${c*.5|0},${c*.62|0},${c*.28|0})`,e.lineWidth=1.3,e.beginPath(),e.moveTo(0,0),e.lineTo(-l*.5,0),e.stroke();let f=t.leaflets[0]+Math.floor(n()*(t.leaflets[1]-t.leaflets[0]+1)),u=Array.from({length:f},(d,h)=>h).sort((d,h)=>Math.abs(h-(f-1)/2)-Math.abs(d-(f-1)/2));for(let d of u){let h=f>1?d/(f-1)*2-1:0,_=l*(1-t.shorter*h*h)*(.94+n()*.12);e.save(),e.rotate(h*t.fan+(n()-.5)*.08),r(_,_*t.wide,c*(1-.14*Math.abs(h))*(.95+n()*.1)),e.restore()}e.restore()}}var op={hands:16,reach:[44,62],leaflets:[5,7],fan:1.75,shorter:.42,wide:.19,widest:.66,ribs:7,spread:.33},kx={rings:[[6,.1,.4,100,.2],[4,.04,.27,138,.9]]};function Do(e,n,t,{count:r,len:o,wid:i,lobes:a=0,v0:s,v1:l,spread:c=.34}){let f=[];for(let u=0;u<r;u++){let d=t()*Math.PI*2,h=n*c*Math.sqrt(t()),_=o[0]+t()*(o[1]-o[0]);f.push([n/2+Math.cos(d)*h,n/2+Math.sin(d)*h,t()*Math.PI*2,_,_*i,a,s+t()*(l-s)])}f.sort((u,d)=>u[6]-d[6]);for(let u of f)Uo(e,...u)}var ip=new Map;function ap(e,n){return ip.set(e,n),e.onUpdate=()=>{e.image.data=null},e}function o3(){for(let[e,n]of ip)e.image.data=n(),e.needsUpdate=!0}var Ii=null;function sp(e){if(Ii??={},Ii[e])return Ii[e];let n=ap(ep(Ol(e),Xi(e)),()=>$l(Ol(e),Xi(e)));return e==="willow"&&(n.wrapS=fn,n.wrapT=fn),Ii[e]=n,n}var Xi=e=>e==="pine"||fr[e]?.needles?[60,95,45]:e==="willow"?[110,130,60]:[80,115,50],at={cols:4,rows:4,kinds:["pine","leaf","birch","willowleaf","poplar","bush","oak","plane","chestnut","chestnutwhorl",...Object.keys(fr)]},Ni=null;function Kl(){if(Ni)return Ni;let{data:e,w:n,h:t}=Bh();return Ni=ap(tp(e,n,t),()=>Bh().data),Ni}function Bh(){let e=256*mn,n=e*at.cols,t=e*at.rows,r=new Uint8Array(n*t*4),[o,i,a]=Xi("leaf");for(let s=0;s<n*t*4;s+=4)r[s]=o,r[s+1]=i,r[s+2]=a;return at.kinds.forEach((s,l)=>{let c=$l(Ol(s),Xi(s)),f=l%at.cols*e,u=Math.floor(l/at.cols)*e;for(let d=0;d<e;d++)r.set(c.subarray(d*e*4,(d+1)*e*4),((u+d)*n+f)*4);lp[s]=Vx(c,e)}),{data:r,w:n,h:t}}var Oi=.025,lp={};function Vx(e,n){let t=Math.ceil(ac*255),[r,o,i,a]=[n,n,-1,-1];for(let s=0;s<n;s++)for(let l=0;l<n;l++)e[(s*n+l)*4+3]<t||(r=Math.min(r,l),i=Math.max(i,l),o=Math.min(o,s),a=Math.max(a,s));return i<0?null:[Math.max(0,r/n-Oi),Math.max(0,o/n-Oi),Math.min(1,(i+1)/n+Oi),Math.min(1,(a+1)/n+Oi)]}var zx=[[0,1],[1,1],[0,0],[1,0]];function Wx(e,n){if(!e||!n)return e;Zl(e);let[t,r,o,i]=n,a=[[t,i],[o,i],[t,r],[o,r]],s=e.attributes.uv,l=Object.values(e.attributes);for(let c=0;c+3<s.count;c+=4)if(zx.every(([f,u],d)=>s.getX(c+d)===f&&s.getY(c+d)===u))for(let f of l)for(let u=0;u<f.itemSize;u++){let[d,h,_,T]=[0,1,2,3].map(p=>f.getComponent(c+p,u));a.forEach(([p,m],v)=>{let x=d+(h-d)*p,g=_+(T-_)*p;f.setComponent(c+v,u,g+(x-g)*m)})}for(let c of l)c.needsUpdate=!0;return e.boundingBox=null,e.boundingSphere=null,e}var Xt=(e,n)=>e==="leaf"&&_p.has(n)?"plane":gn[e].texture,Jr=e=>at.kinds.includes(e)?"leaves":e,Nl=e=>at.kinds.includes(e)?Kl():sp(e);function mr(e,n){if(!e)return e;let t=Math.max(0,at.kinds.indexOf(n)),r=e.attributes.position.count,o=new Float32Array(r*2);for(let i=0;i<r;i++)o[i*2]=t%at.cols/at.cols,o[i*2+1]=Math.floor(t/at.cols)/at.rows;return e.setAttribute("fCell",new Ie(o,2)),e}function No(e,n,t=256*mn){let r=at.kinds.indexOf(n);if(!e||r<0||e.userData.atlas)return e;Kl(),Wx(e,lp[n]);let o=e.attributes.uv,i=.5/t,a=r%at.cols,s=Math.floor(r/at.cols);for(let l=0;l<o.count;l++)o.setXY(l,(a+i+o.getX(l)*(1-2*i))/at.cols,(s+i+o.getY(l)*(1-2*i))/at.rows);return o.needsUpdate=!0,e.userData.atlas=n,e}function Ol(e){let t=document.createElement("canvas");t.width=t.height=256*mn;let r=t.getContext("2d",{willReadFrequently:!0});r.scale(mn,mn);let o=Ne(e==="pine"?5:e==="willow"?13:e==="oak"?9:e==="birch"?17:e==="poplar"?23:e==="bush"?29:e==="willowleaf"?31:e==="plane"?41:e==="chestnut"?43:e==="chestnutwhorl"?47:fr[e]?.seed??37);if(fr[e])fr[e].paint(r,256,o,{paintLeaf:Uo,dilate:an});else if(e==="willow"){for(let a=0;a<3;a++){let s=256*(.2+a*.3);for(let l=0;l<5;l++){let c=l/5*256,f=Math.PI/2+(o()-.5)*.15,u=256/5+20+o()*6,d=6.5,h=138+o()*55,_=s+(o()-.5)*12;Uo(r,_,c,f,u,d,0,h),Uo(r,_+(o()-.5)*16,c+u*.32,f+(o()-.5)*.2,u*.75,d*.8,0,h-15),c+u>254&&Uo(r,_,c-256,f,u,d,0,h)}}an(r,1)}else if(e==="pine"){for(let i=0;i<8;i++){let a=o()*Math.PI*2,s=256*(.3+o()*.4),l=256*(.3+o()*.4),c=256*(.22+o()*.1),f=s+Math.cos(a)*c,u=l+Math.sin(a)*c;r.strokeStyle="rgb(78,58,34)",r.lineWidth=2,r.beginPath(),r.moveTo(s,l),r.lineTo(f,u),r.stroke();for(let d=1;d<=18;d++){let h=d/18,_=s+(f-s)*h,T=l+(u-l)*h,p=14+o()*18,m=90+o()*60;for(let v of[-1,1]){let x=a+v*(.5+o()*.2);r.strokeStyle=`rgb(${m*.38|0},${m*.7|0},${m*.3|0})`,r.lineWidth=2.6,r.beginPath(),r.moveTo(_,T),r.lineTo(_+Math.cos(x)*p,T+Math.sin(x)*p),r.stroke()}}}an(r,1)}else if(e==="oak"){let i=(a,s,l,c)=>{r.save(),r.translate(a,s),r.rotate(l);let f=3,u=c*.62;r.beginPath(),r.moveTo(0,0);for(let h=1;h<=28;h++){let _=h/28,T=Math.sin(_*Math.PI),p=.7+.3*Math.max(0,Math.sin(_*f*Math.PI));r.lineTo(_*c,u*T*p)}for(let h=28;h>=0;h--){let _=h/28,T=Math.sin(Math.max(_,.001)*Math.PI),p=.7+.3*Math.max(0,Math.sin(_*f*Math.PI));r.lineTo(_*c,-u*T*p)}r.closePath();let d=100+o()*70;r.fillStyle=`rgb(${d*.4|0},${d*.68|0},${d*.28|0})`,r.fill(),r.fillStyle=`rgb(${d*.58|0},${d*.94|0},${d*.4|0})`,r.save(),r.translate(c*.14,0),r.scale(.68,.52),r.fill(),r.restore(),r.strokeStyle=`rgba(${Math.min(255,d*.8)|0},${Math.min(255,d)|0},${d*.32|0},0.85)`,r.lineWidth=.9,r.beginPath(),r.moveTo(c*.08,0),r.lineTo(c*.88,0),r.stroke(),r.restore()};for(let a=0;a<22;a++){let s=o()*Math.PI*2,l=256*.34*Math.sqrt(o());i(256/2+Math.cos(s)*l,256/2+Math.sin(s)*l,o()*Math.PI*2,34+o()*28)}an(r,2)}else if(e==="birch")Do(r,256,o,{count:26,len:[18,32],wid:.52,v0:165,v1:225,spread:.4}),an(r,1);else if(e==="plane"){let i=(a,s,l,c,f)=>{r.save(),r.translate(a,s),r.rotate(l),r.beginPath();let u=60;for(let d=0;d<=u;d++){let h=-Math.PI*.92+d/u*Math.PI*1.84,_=Math.pow(Math.abs(Math.cos(h*2.5)),.7),T=c*(.38+.62*_)*(.75+.25*Math.cos(h*.5)),p=Math.cos(h)*T,m=Math.sin(h)*T;d?r.lineTo(p,m):r.moveTo(p,m)}r.lineTo(-c*.12,0),r.closePath(),r.fillStyle=`rgb(${f*.42|0},${f*.7|0},${f*.3|0})`,r.fill(),r.save(),r.scale(.66,.66),r.fillStyle=`rgb(${f*.6|0},${f*.95|0},${f*.42|0})`,r.fill(),r.restore(),r.strokeStyle=`rgba(${Math.min(255,f*.75)|0},${Math.min(255,f)|0},${f*.35|0},0.8)`,r.lineWidth=.8;for(let d of[0,.4,-.4,.8,-.8])r.beginPath(),r.moveTo(-c*.1,0),r.lineTo(Math.cos(d*Math.PI)*c*.85,Math.sin(d*Math.PI)*c*.85),r.stroke();r.beginPath(),r.moveTo(-c*.1,0),r.lineTo(-c*.55,0),r.stroke(),r.restore()};for(let a=0;a<18;a++){let s=o()*Math.PI*2,l=256*.34*Math.sqrt(o());i(256/2+Math.cos(s)*l,256/2+Math.sin(s)*l,o()*Math.PI*2,17+o()*11,100+o()*70)}an(r,2)}else if(e==="chestnut"){let i=op,a=Hh(r,o),s=[];for(let l=0;l<i.hands;l++){let c=o()*Math.PI*2,f=256*i.spread*Math.sqrt(o());s.push([256/2+Math.cos(c)*f,256/2+Math.sin(c)*f,o()*Math.PI*2,i.reach[0]+o()*(i.reach[1]-i.reach[0]),96+o()*78])}s.sort((l,c)=>l[4]-c[4]);for(let l of s)a(...l);an(r,2)}else if(e==="chestnutwhorl"){let i=kx,a=Hh(r,o),s=256/2;for(let[l,c,f,u,d]of i.rings)for(let h=0;h<l;h++){let _=d+h/l*Math.PI*2+(o()-.5)*.25;a(s+Math.cos(_)*256*c,s+Math.sin(_)*256*c,_,256*f*(.94+o()*.1),u+o()*30)}an(r,2)}else e==="poplar"?(Do(r,256,o,{count:48,len:[22,40],wid:.42,v0:90,v1:155,spread:.4}),an(r,1)):e==="bush"?(Do(r,256,o,{count:36,len:[18,34],wid:.7,v0:110,v1:175,spread:.4}),an(r,1)):e==="willowleaf"?(Do(r,256,o,{count:20,len:[36,64],wid:.2,v0:130,v1:190,spread:.32}),an(r,1)):(Do(r,256,o,{count:30,len:[28,50],wid:.46,v0:100,v1:170,spread:.38}),an(r,2));return t}function an(e,n){let{width:t,height:r}=e.canvas,o=e.getImageData(0,0,t,r);Dh(o.data,o.data,t,r,n),e.save(),e.setTransform(1,0,0,1,0,0),e.putImageData(o,0,0),e.restore()}function Xx(e,n,t,r){let o=n+t/2,i=t*.97,a=t*.04;e.strokeStyle="rgb(150,185,120)",e.lineWidth=2.2,e.beginPath(),e.moveTo(o,i),e.lineTo(o,a+6),e.stroke();let s=l=>t*.27*(l<.3?.4+.6*(l/.3):Math.pow((1-l)/.7,.75));for(let l=0;l<190;l++){let c=.05+.95*(l/190),f=s(c),u=o+(r()*2-1)*f,d=i+(a-i)*c+(r()-.5)*3,h=2.5+r()*1.6-c*.9,_=226+r()*29;e.fillStyle=`rgb(${_},${_},${_-6|0})`;for(let T=0;T<4;T++){let p=T/4*Math.PI*2+r()*1.5;e.beginPath(),e.arc(u+Math.cos(p)*h*.9,d+Math.sin(p)*h*.9,h,0,Math.PI*2),e.fill()}e.fillStyle=r()<.5?"rgb(235,200,90)":"rgb(225,120,135)",e.beginPath(),e.arc(u,d,h*.42,0,Math.PI*2),e.fill()}}var Fi=null,Yl=2;function cp(){if(Fi)return Fi;let e=128,n=document.createElement("canvas");n.width=e*mn*Yl,n.height=e*mn;let t=n.getContext("2d",{willReadFrequently:!0});t.scale(mn,mn),Xx(t,e,e,Ne(67));let r=Ne(61);for(let o=0;o<110;o++){let i=r()*Math.PI*2,a=e*.4*Math.sqrt(r()),s=e/2+Math.cos(i)*a,l=e/2+Math.sin(i)*a,c=220+r()*35,f=2.4+r()*1.4;t.fillStyle=`rgb(${c},${c},${c})`;for(let u=0;u<5;u++){let d=u/5*Math.PI*2+r();t.beginPath(),t.arc(s+Math.cos(d)*f,l+Math.sin(d)*f,f*.85,0,Math.PI*2),t.fill()}t.fillStyle="rgb(120,110,80)",t.beginPath(),t.arc(s,l,f*.45,0,Math.PI*2),t.fill()}return Fi=ep(n,[200,200,200]),Fi}function Vi(e,n,t,r,o=0,i=null){let a=[];for(let[s,[l,c,f,u]]of e.entries())for(let d=0;d<n;d++){let h=(d+.5)/n,_=Math.acos(1-2*h)+(r()-.5)*.3,T=d*2.39996+r()*.5,p=new te(Math.sin(_)*Math.cos(T),Math.cos(_),Math.sin(_)*Math.sin(T)),m=t*u*(.8+r()*.5),v=r()*Math.PI*2,x=.85+r()*.25;o&&(x-=o*r()),p.y<0&&(x/=Math.hypot(p.x,p.z,p.y/Jh));let g=p.clone().multiplyScalar(u*x).add(new te(l,c,f));if(i?.(s,g.x,g.y,g.z))continue;let E=new Ct(m,m),b=new Yt().setFromUnitVectors(new te(0,0,1),p);b.multiply(new Yt().setFromAxisAngle(new te(0,0,1),v)),E.applyQuaternion(b),E.translate(g.x,g.y,g.z);let w=E.attributes.position,S=E.attributes.normal;for(let A=0;A<w.count;A++){let C=new te(w.getX(A)-l,w.getY(A)-c,w.getZ(A)-f).normalize();S.setXYZ(A,C.x,C.y,C.z)}a.push(E)}return sn(Ge(a),a.length,r,{low:3,high:8.5})}var Cl=new WeakMap;function fp(e,n){if(!e.shell)return{leafy:n,drop:null,heart:[]};if(!Cl.has(e)){let{seen:t,heart:r}=Nh(n);Cl.set(e,{leafy:t.map(o=>n[o]),drop:(o,i,a,s)=>Oh(n,t[o],i,a,s),heart:r.map(o=>n[o])})}return Cl.get(e)}function up(e,n,t=Lo){if(!e.length)return null;let r=[];for(let[a,s,l,c]of e){let f=n()*Math.PI;for(let u=0;u<t.planes;u++){let d=t.size*c*(.9+n()*.2),h=n()*Math.PI*2,_=u===0?-Math.PI/2+(n()-.5)*.5:(n()-.5)*.5,T=Math.max(t.tiles,Math.ceil(d/t.tile)),p=d/T;for(let m=0;m<T;m++)for(let v=0;v<T;v++){let x=new Ct(p,p);x.translate((m+.5)*p-d/2,(v+.5)*p-d/2,0),x.rotateZ(h),x.rotateX(_),x.rotateY(f+u/t.planes*Math.PI),x.translate(a,s,l);let g=x.attributes.position,E=x.attributes.normal;for(let b=0;b<g.count;b++){let w=new te(g.getX(b)-a,g.getY(b)-s,g.getZ(b)-l).normalize();E.setXYZ(b,w.x,w.y,w.z)}r.push(x)}}}let o=Ge(r),i=new Float32Array(o.attributes.position.count*3).fill(t.shade);return o.setAttribute("color",new Ie(i,3)),o}var dp=(e,n)=>e&&n?Ge([e,n.clone()]):e;function Fl(e,n,t,r){let o=[];for(let[i,a,s,l]of e)for(let c=0;c<n;c++){let f=r()*Math.PI*2,u=l*(.15+.9*Math.pow(r(),.5)),d=(r()-.28)*l,h=t*l*(.7+r()*.5),_=new Ct(h,h*(.8+r()*.3)),T=new te(Math.cos(f),.25+r()*.55,Math.sin(f)).normalize(),p=new Yt().setFromUnitVectors(new te(0,0,1),T);p.multiply(new Yt().setFromAxisAngle(new te(0,0,1),r()*Math.PI)),_.applyQuaternion(p),_.translate(i+Math.cos(f)*u,a+d,s+Math.sin(f)*u);let m=_.attributes.position,v=_.attributes.normal;for(let x=0;x<m.count;x++){let g=new te(m.getX(x)-i,(m.getY(x)-a)*.5+.45,m.getZ(x)-s).normalize();v.setXYZ(x,g.x,g.y,g.z)}o.push(_)}return sn(Ge(o),o.length,r,{low:3,high:8.5})}var $x={out:[.8,.62],size:[.62,.45],drop:[.55,-.35]};function Kx(e,n,t=$x){let[r,o,i,a,s]=e[0],l=e.at(-1);return[[r*t.size[0],o*.8,i-t.drop[0],a+Math.cos(n)*r*t.out[0],s+Math.sin(n)*r*t.out[0]],[r*t.size[1],o*.7,(i+l[2])/2-t.drop[1],a-Math.cos(n+.5)*r*t.out[1],s-Math.sin(n+.5)*r*t.out[1]]]}function Pl(e,n,t,r,o,i,a){if(e!=="scots"||!r)return r;let s=Kx(o,(n*7+t*13)%20*.314),l=s.map(([c,,f,u,d])=>[u,f,d,c]);return Ge([r,Wt(qr(s,Ne(23559+a*101+t*31),i),l)])}function qr(e,n,{every:t=1,grow:r=1,deep:o=null,under:i=0}={}){let a=la(e),s=[];for(let[f,u,d,h,_]of a){let T=Math.max(3,Math.round(d/t));for(let p=0;p<T;p++){if(n()<.12)continue;let m=p/T*Math.PI*2+n()*.4,v=(1.5+f*.45)*(.8+n()*.4)*1.28*r,x=new Ct(v,v*.8);x.rotateX(-Math.PI/2+.55+n()*.2),x.translate(0,0,f*(o?o[0]+n()*(o[1]-o[0]):.55+n()*.15)),x.rotateY(-m),x.translate(h,u-.6+n()*.4,_);let g=x.attributes.position,E=x.attributes.normal;for(let b=0;b<g.count;b++){let w=new te(g.getX(b)-h,.6,g.getZ(b)-_).normalize();E.setXYZ(b,w.x,w.y,w.z)}s.push(x)}}let l=sn(Ge(s),s.length,n,{low:1,high:10});if(!i)return l;let c=qx(e,{count:i/t,grow:r});return Ge([l,Zx(e,{count:i/t,grow:r}),...c?[c]:[]])}var ur={gap:.45,from:.3,to:.65,perMetre:2.5,least:4},Yx=e=>(1.5+e*.45)*1.28*.8;function qx(e,{count:n=1,grow:t=1}={}){if(e.some(a=>a[5]!=null))return null;let r=Ne(Math.round(e.reduce((a,[s,l,c])=>a+s*131+l*17+c*7,0)*1e3)^28702),o=la(e).sort((a,s)=>a[1]-s[1]),i=[];for(let a=1;a<o.length;a++){let[s,l,,c,f]=o[a-1],[u,d,,h,_]=o[a],T=(s+u)/2;if(d-l<=ur.gap*Yx(T))continue;let[p,m,v]=[(l+d)/2,(c+h)/2,(f+_)/2],x=Math.max(ur.least,Math.round((ur.least+T*ur.perMetre)*n));for(let g=0;g<x;g++){let E=g/x*Math.PI*2+r()*.5,b=(1.5+T*.45)*(.8+r()*.4)*1.28*t,w=new Ct(b,b*.8);w.rotateX(-Math.PI/2+.55+r()*.2),w.translate(0,0,T*(ur.from+r()*(ur.to-ur.from))),w.rotateY(-E),w.translate(m,p-.6+r()*.4,v);let S=w.attributes.position,A=w.attributes.normal;for(let C=0;C<S.count;C++){let P=new te(S.getX(C)-m,.6,S.getZ(C)-v).normalize();A.setXYZ(C,P.x,P.y,P.z)}i.push(w)}}return i.length?sn(Ge(i),i.length,r,{low:1,high:10}):null}var $n={perMetre:2.6,from:.3,to:.75,size:.8,shade:.72};function Zx(e,{count:n=1,grow:t=1}={}){let r=Ne(Math.round(e.reduce((s,[l,c,f])=>s+l*131+c*17+f*7,0)*1e3)^3342),o=[];for(let[s,l,c,f,u]of e){let d=Math.max(3,Math.round(s*$n.perMetre*n));for(let h=0;h<d;h++){if(r()<.1)continue;let _=h/d*Math.PI*2+r()*.5,T=$n.from+r()*($n.to-$n.from),p=(1.5+s*.45)*(.8+r()*.4)*1.28*$n.size*t,m=new Ct(p,p*.8);m.rotateX(-Math.PI/2+.15+r()*.2),m.translate(0,0,s*T),m.rotateY(-_),m.translate(f,c-l*(.3+.22*T)-.1,u);let v=m.attributes.position,x=m.attributes.normal;for(let g=0;g<v.count;g++){let E=new te(v.getX(g)-f,-.5,v.getZ(g)-u).normalize();x.setXYZ(g,E.x,E.y,E.z)}o.push(m)}}let i=sn(Ge(o),o.length,r,{low:1,high:10}),a=i.attributes.color;for(let s=0;s<a.count;s++)a.setXYZ(s,a.getX(s)*$n.shade,a.getY(s)*$n.shade,a.getZ(s)*$n.shade);return i}var Oo={pine:[{name:"dark green",hue:[.292,.347],sat:[.35,.45],light:[.24,.32],weight:4},{name:"blue-grey",hue:[.4,.46],sat:[.18,.3],light:[.3,.38],weight:1.5},{name:"deep",hue:[.31,.36],sat:[.3,.4],light:[.18,.24],weight:1},{name:"yellow-green",hue:[.25,.29],sat:[.3,.4],light:[.27,.33],weight:.9}],leaf:[{name:"mid green",hue:[.236,.292],sat:[.38,.5],light:[.3,.4],weight:4},{name:"fresh",hue:[.2,.25],sat:[.48,.6],light:[.36,.44],weight:2},{name:"deep",hue:[.27,.33],sat:[.35,.45],light:[.22,.29],weight:2},{name:"olive",hue:[.15,.2],sat:[.35,.45],light:[.3,.37],weight:1.2},{name:"silvery",hue:[.24,.3],sat:[.12,.22],light:[.38,.46],weight:.8},{name:"copper beech",hue:[.96,1],sat:[.25,.38],light:[.2,.27],weight:.25},{name:"lime",hue:[.19,.23],sat:[.5,.6],light:[.38,.45],weight:.7},{name:"blue-green",hue:[.3,.36],sat:[.26,.36],light:[.26,.33],weight:.9},{name:"turning",hue:[.09,.13],sat:[.5,.62],light:[.34,.42],weight:.12}],birch:[{name:"fresh",hue:[.19,.24],sat:[.45,.58],light:[.38,.46],weight:3},{name:"mid",hue:[.23,.27],sat:[.38,.5],light:[.33,.4],weight:2},{name:"turning",hue:[.12,.16],sat:[.5,.6],light:[.38,.45],weight:.3},{name:"deep",hue:[.24,.29],sat:[.35,.45],light:[.28,.34],weight:1}],willow:[{name:"yellow-green",hue:[.17,.22],sat:[.4,.55],light:[.38,.46],weight:3},{name:"silvery",hue:[.2,.26],sat:[.18,.3],light:[.4,.47],weight:1.5}],poplar:[{name:"deep",hue:[.26,.31],sat:[.35,.45],light:[.24,.3],weight:2},{name:"fresh",hue:[.22,.26],sat:[.42,.54],light:[.32,.4],weight:1.5},{name:"silvery",hue:[.22,.28],sat:[.14,.24],light:[.36,.43],weight:.6}],bush:[{name:"dark",hue:[.28,.34],sat:[.3,.42],light:[.2,.27],weight:3},{name:"glossy",hue:[.3,.36],sat:[.35,.48],light:[.24,.3],weight:2},{name:"yellow-green",hue:[.2,.24],sat:[.35,.48],light:[.28,.35],weight:1.5},{name:"golden",hue:[.14,.18],sat:[.5,.62],light:[.36,.44],weight:.6},{name:"blue-grey",hue:[.42,.48],sat:[.14,.24],light:[.3,.37],weight:.8},{name:"purple-leaved",hue:[.93,.99],sat:[.25,.38],light:[.2,.27],weight:.4},{name:"silvery",hue:[.24,.3],sat:[.1,.18],light:[.4,.47],weight:.4}],scots:[{name:"yellow-green",hue:[.22,.27],sat:[.28,.38],light:[.27,.34],weight:3},{name:"grey-green",hue:[.27,.32],sat:[.18,.28],light:[.28,.34],weight:1.5}],oak:[{name:"mid green",hue:[.22,.28],sat:[.35,.47],light:[.27,.36],weight:3},{name:"deep",hue:[.26,.31],sat:[.32,.42],light:[.22,.28],weight:2},{name:"olive",hue:[.16,.21],sat:[.32,.42],light:[.28,.34],weight:1},{name:"fresh",hue:[.2,.24],sat:[.42,.52],light:[.32,.4],weight:1}],column:[{name:"yew",hue:[.36,.42],sat:[.25,.36],light:[.15,.19],weight:3},{name:"cypress",hue:[.3,.36],sat:[.28,.38],light:[.16,.2],weight:1.5}],spruce:[{name:"blue-green",hue:[.38,.45],sat:[.2,.32],light:[.23,.3],weight:3},{name:"dark",hue:[.33,.39],sat:[.25,.35],light:[.2,.26],weight:1.5},{name:"silver-blue",hue:[.45,.5],sat:[.15,.25],light:[.32,.38],weight:.6}],snag:[{name:"bare twigs",hue:[.07,.12],sat:[.1,.18],light:[.3,.38],weight:1}],beech:[{name:"bright",hue:[.21,.26],sat:[.45,.56],light:[.3,.38],weight:3},{name:"deep",hue:[.24,.29],sat:[.36,.46],light:[.25,.31],weight:1.5},{name:"copper",hue:[.93,.98],sat:[.24,.34],light:[.16,.21],weight:.65}],chestnut:[{name:"dark",hue:[.27,.32],sat:[.38,.48],light:[.25,.31],weight:3},{name:"mid",hue:[.25,.29],sat:[.42,.52],light:[.3,.36],weight:1.5}],cedar:[{name:"blue-green",hue:[.36,.43],sat:[.18,.28],light:[.21,.27],weight:3},{name:"silvery",hue:[.4,.47],sat:[.12,.2],light:[.3,.36],weight:1}],holly:[{name:"dark glossy",hue:[.29,.35],sat:[.32,.44],light:[.16,.21],weight:3},{name:"variegated",hue:[.17,.22],sat:[.3,.42],light:[.3,.36],weight:.4}],hawthorn:[{name:"fresh",hue:[.21,.26],sat:[.4,.5],light:[.28,.35],weight:3},{name:"grey-green",hue:[.24,.29],sat:[.24,.34],light:[.27,.33],weight:1.2}]},jx={share:.0125};Oo.accent=[{name:"gold",hue:[.11,.14],sat:[.5,.62],light:[.36,.43],weight:1.2},{name:"copper",hue:[.03,.065],sat:[.42,.55],light:[.27,.33],weight:1}];var Qx=new Set([ht.leaf,ht.birch,ht.willow,ht.poplar,ht.oak,ht.beech,ht.chestnut,ht.hawthorn]);Oo.autumn=[...Oo.accent,{name:"rust",hue:[.07,.095],sat:[.5,.62],light:[.3,.36],weight:1},{name:"red",hue:[0,.025],sat:[.45,.6],light:[.28,.34],weight:.5},{name:"turning",hue:[.15,.19],sat:[.45,.55],light:[.32,.38],weight:1.1}];Oo.dead=[{name:"dead leaves",hue:[.05,.1],sat:[.3,.42],light:[.24,.3],weight:1}];var hp=[{name:"pink",hue:[.93,.97],sat:[.55,.75],light:[.72,.8],weight:3},{name:"magenta",hue:[.87,.92],sat:[.55,.7],light:[.55,.65],weight:1.5},{name:"white",hue:[.1,.16],sat:[.1,.3],light:[.9,.95],weight:2},{name:"lilac",hue:[.74,.8],sat:[.35,.55],light:[.7,.78],weight:1.5},{name:"red",hue:[.98,1],sat:[.6,.75],light:[.45,.52],weight:1},{name:"yellow",hue:[.13,.16],sat:[.75,.9],light:[.55,.62],weight:1.2},{name:"orange",hue:[.06,.09],sat:[.7,.85],light:[.55,.62],weight:.4}];function pr(e,n,t=new ye,r=Oo[e]){let o=n()*r.reduce((s,l)=>s+l.weight,0),i=r.find(s=>(o-=s.weight)<0)??r[0],a=([s,l])=>s+n()*(l-s);return t.setHSL(a(i.hue)%1,a(i.sat),a(i.light))}function sn(e,n,t,{low:r=0,high:o=10}={}){let i=e.attributes.position,a=new Float32Array(i.count*3),s=i.count/n;for(let l=0;l<n;l++){let c=.84+t()*.28,f=(t()-.5)*.08;for(let u=Math.floor(l*s);u<Math.floor((l+1)*s);u++){let d=Math.min(1,Math.max(0,(i.getY(u)-r)/(o-r))),h=c*(.82+.22*d);a[u*3]=Math.min(1,h*(1+f)),a[u*3+1]=Math.min(1,h),a[u*3+2]=Math.min(1,h*(1-f))}}return e.setAttribute("color",new Ie(a,3)),e}var Jx={foot:.82,crown:.5,from:0,to:.5,cool:[.02,.05]},eE={foot:.98,crown:.8,from:0,to:.5,cool:[.01,.05]},pp=e=>Ji(e,eE);function Ji(e,n=Jx){let t=no(n.from,n.to,e),r=n.foot+(n.crown-n.foot)*t,o=n.cool[0]+(n.cool[1]-n.cool[0])*t;return[r*(1-o),r,r*(1+o)]}var tE={high:1.5,arc:.42,tint:[.72,1.12,.6]};function nE(e,n,t=tE){let r=1-no(t.high*.25,t.high,e),o=1-no(t.arc*.4,t.arc,Math.abs(n-.5)),i=r*o;return i<=0?null:t.tint.map(a=>1+(a-1)*i)}var hr={rings:4,fine:8,sides:6,fineSides:7,flare:[0,.2,.56,1],branch:[3,4]};function Yr(e,n=null,t="furrowed",r=!1,o=!1){let i=n===!0||n==="birch"||n==="smooth"?pp:Ji,a=o?null:i,s=o?null:()=>i(1);n===!0&&(n="birch");let l=Dn[t]??0,c=Ne(Math.round(e.height*1e3+e.a*100)),f=n==="birch"||n==="scots"||n==="plane",u=null,d=null;if(n==="birch"){let w=Array.from({length:84},()=>c()<.2?.28+c()*.2:1);u=(S,A,C)=>S<.12?.45+S*3:w[C%12*7+A%7],d=()=>.85}else if(n==="plane"){let w=Array.from({length:84},()=>{let S=c();return S<.25?[1.45,1.42,1.2]:S<.45?[1.1,1.15,.9]:S<.6?[1.15,1.15,1.15]:[1,1,1]});u=(S,A,C)=>w[C%12*7+A%7]}else if(n==="scots"){let w=[.62,.66,.78],S=Array.from({length:84},()=>.9+c()*.18);u=(A,C,P)=>{let D=Math.min(1,Math.max(0,(A-.3)/.35)),U=S[P%12*7+C%7];return w.map(L=>(L+(1-L)*D)*U)},d=()=>[1,.97,.95]}let h=u,_=(w,S,A,C)=>{let P=h?h(w,S,A):1,D=nE(w*e.height,(S+.5)/C);if(!D)return P;let[U,L,F]=Array.isArray(P)?P:[P,P,P];return[U*D[0],L*D[1],F*D[2]]},T=r?f?hr.fine:hr.rings:f?At?18:12:At?7:6,p=Math.min(.5,wc(e)/e.height),m=(r?hr.flare:[0,.08,.2,.36,.56,.78,1]).map(w=>w*p);for(let w=1;w<=T;w++)m.push(p+(1-p)*(w/T));let v=r?f?hr.fineSides:hr.sides:At?12:10,[x,g]=r?hr.branch:At?[6,6]:[4,5],E=[Et(w=>Rn(e,w),w=>Tr(e,w),m.length-1,v,(w,S,A)=>_(w,S,A,v),l,{ts:m,flare:(w,S)=>Ac(e,w,S),under:a})],b=0;for(let w of e.branches)if(w.stem){let S=++b*5;E.push(Et(A=>br(e,w,A),A=>wr(w,A),T,v,u?(A,C,P)=>u(A,C,P+S):null,l,{under:a}))}else E.push(Et(S=>br(e,w,S),S=>wr(w,S),x,g,d,l,{under:s}));return Ge(E)}var rE=1.2;function Et(e,n,t,r,o=null,i=0,{ts:a=null,flare:s=null,under:l=null}={}){let c=E=>a?a[E]:E/t,f=[],u=[],d=[],h=[],_=[],T=E=>{let b=e(E),w=e(Math.min(1,E+.02)),S=e(Math.max(0,E-.02)),A=new te(w[0]-S[0],w[1]-S[1],w[2]-S[2]).normalize(),C=Math.abs(A.y)<.9?new te(0,1,0):new te(1,0,0),P=new te().crossVectors(A,C).normalize(),D=new te().crossVectors(A,P).normalize(),U=n(E),L=Math.hypot(w[0]-S[0],w[1]-S[1],w[2]-S[2])||1;return Array.from({length:r},(F,G)=>{let H=G/r*Math.PI*2,X=P.clone().multiplyScalar(Math.cos(H)).addScaledVector(D,Math.sin(H)),$=s?U*s(E,H):U,j=X;if(s){let Z=n(Math.min(1,E+.02))*s(Math.min(1,E+.02),H),ge=n(Math.max(0,E-.02))*s(Math.max(0,E-.02),H);j=X.clone().addScaledVector(A,(ge-Z)/L).normalize()}return{p:[b[0]+X.x*$,b[1]+X.y*$,b[2]+X.z*$],n:[j.x,j.y,j.z]}})},p=Array.from({length:t+1},(E,b)=>T(c(b))),m=At?.68:rE,v=Math.max(1,Math.round(2*Math.PI*n(0)/m)),x=[0];for(let E=1;E<=t;E++){let[b,w,S]=e(c(E-1)),[A,C,P]=e(c(E));x.push(x[E-1]+Math.hypot(A-b,C-w,P-S))}for(let E=0;E<t;E++)for(let b=0;b<r;b++){let w=p[E][b],S=p[E][(b+1)%r],A=p[E+1][b],C=p[E+1][(b+1)%r],P=o?o((c(E)+c(E+1))/2,b,E):1,[D,U,L]=Array.isArray(P)?P:[P,P,P],[F,G]=l?[l(c(E)),l(c(E+1))]:[null,null],H=b/r*v,X=(b+1)/r*v,$=x[E]/m,j=x[E+1]/m;for(let[Z,ge,_e,ke]of[[w,H,$,F],[S,X,$,F],[A,H,j,G],[S,X,$,F],[C,X,j,G],[A,H,j,G]])f.push(...Z.p),u.push(...Z.n),ke?d.push(D*ke[0],U*ke[1],L*ke[2]):d.push(D,U,L),h.push(ge,_e),_.push(i)}let g=new xt;return g.setAttribute("position",new Zt(f,3)),g.setAttribute("normal",new Zt(u,3)),g.setAttribute("color",new Zt(d,3)),g.setAttribute("fBarkUv",new Zt(h,2)),g.setAttribute("fBarkKind",new Zt(_,1)),g}var oE=`
          float bNear = 1.0 - smoothstep(${Je(Io.full)}, ${Je(Io.fade)}, length(vViewPosition));
          if (bNear > 0.0) {
            vec3 n0 = normalize(vNormal);
            vec3 p0 = dFdx(-vViewPosition);
            vec3 p1 = dFdy(-vViewPosition);
            vec2 u0 = dFdx(vBark.xy);
            vec2 u1 = dFdy(vBark.xy);
            vec3 p1n = cross(p1, n0);
            vec3 p0n = cross(n0, p0);
            vec3 bT = p1n * u0.x + p0n * u1.x;
            vec3 bB = p1n * u0.y + p0n * u1.y;
            float bDet = max(dot(bT, bT), dot(bB, bB));
            float bS = bDet == 0.0 ? 0.0 : inversesqrt(bDet);
            vec3 bV = normalize(vViewPosition);
            vec2 bView = vec2(dot(bV, bT * bS), dot(bV, bB * bS)) / max(dot(bV, n0), 0.25);
            for (int j = 0; j < 2; j++) {
              float h = texture(tBark, vec3(bUv, layer)).r;
              bUv += bView * (h - 0.55) * ${Je(Io.depth)} * bNear * 0.5;
            }
          }`;function iE(e){if(!Ce)return e;let n={tBark:Ao().tBark};return e.onBeforeCompile=t=>{Object.assign(t.uniforms,n),t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
attribute vec2 fBarkUv;
attribute float fBarkKind;
varying vec3 vBark;`).replace("#include <begin_vertex>",`#include <begin_vertex>
vBark = vec3(fBarkUv, fBarkKind);`),t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
uniform sampler2DArray tBark;
varying vec3 vBark;
vec2 bLean = vec2(0.0);`).replace("#include <map_fragment>",`#include <map_fragment>
        {
          float px = max(fwidth(vBark.x), fwidth(vBark.y));
          float k = 1.0 - smoothstep(0.03, 0.2, px);
          float layer = floor(vBark.z + 0.5);
          vec2 bUv = vBark.xy;
          ${oE}
          vec3 t = texture(tBark, vec3(bUv, layer)).rgb;
          vec3 tHi = texture(tBark, vec3(fract(bUv * 2.15), layer)).rgb;
          t = mix(t, min(t, tHi), bNear * 0.65);
          diffuseColor.rgb *= mix(1.0, 0.42 + 0.78 * t.r, k * 0.9);
          // (Close up, darker down in the cracks.)
          diffuseColor.rgb *= 1.0 - ${Je(Io.cracks)} * bNear * (1.0 - smoothstep(0.15, 0.6, t.r));
          bLean = vec2(t.g * 2.0 - 1.0, 1.0 - t.b * 2.0) * k * (1.0 + ${Je(Io.lean)} * bNear);
        }`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
        {
          // Round the trunk and up it, in view terms, from how the bark's
          // co-ordinates change across the screen.
          vec3 q0 = dFdx(-vViewPosition);
          vec3 q1 = dFdy(-vViewPosition);
          vec2 s0 = dFdx(vBark.xy);
          vec2 s1 = dFdy(vBark.xy);
          vec3 q1p = cross(q1, normal);
          vec3 q0p = cross(normal, q0);
          vec3 T = q1p * s0.x + q0p * s1.x;
          vec3 B = q1p * s0.y + q0p * s1.y;
          float det = max(dot(T, T), dot(B, B));
          float sc = det == 0.0 ? 0.0 : inversesqrt(det);
          normal = normalize(normal + (T * bLean.x + B * bLean.y) * sc * 0.8);
        }`)},e.customProgramCacheKey=()=>"bark-v4-ultra",e}var Gh=.12,Hi={top:.2,under:.32},dr={span:2.6,between:.6,bright:1.1,fade:[70,130],average:[.243,.445,.119]};function aE(e,n,t=!1){n&&(e.alphaToCoverage=!0);let r=n?Kl():null;return e.onBeforeCompile=o=>{r&&(o.uniforms.tLeaves={value:r}),o.vertexShader=o.vertexShader.replace("#include <common>",`#include <common>
varying vec3 tLocal;
varying float tUnder;${r?`
attribute vec2 fCell;
varying vec2 vCell;
varying vec3 tAt;
varying vec3 tFace;`:""}${t?`
attribute vec4 fBark;
varying vec4 vBark;`:""}`).replace("#include <begin_vertex>",`#include <begin_vertex>
        tLocal = position;
        #ifdef USE_INSTANCING
          tLocal += instanceMatrix[3].xyz * 0.37;
        #endif
        #ifdef USE_BATCHING
          tLocal += batchingMatrix[3].xyz * 0.37;
        #endif
        ${t?"vBark = fBark;":""}
        ${r?"vCell = fCell; tAt = position; tFace = normal;":""}
        tUnder = clamp(-normal.y, 0.0, 1.0);`),o.fragmentShader=o.fragmentShader.replace("#include <common>",`#include <common>
        varying vec3 tLocal;
        varying float tUnder;
        ${r?`uniform sampler2D tLeaves;
varying vec2 vCell;
varying vec3 tAt;
varying vec3 tFace;`:""}
        ${t?"varying vec4 vBark;":""}
        float tHash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
        float tNoise(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(tHash(i), tHash(i + vec3(1, 0, 0)), f.x), mix(tHash(i + vec3(0, 1, 0)), tHash(i + vec3(1, 1, 0)), f.x), f.y),
                     mix(mix(tHash(i + vec3(0, 0, 1)), tHash(i + vec3(1, 0, 1)), f.x), mix(tHash(i + vec3(0, 1, 1)), tHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
        }`).replace("#include <map_fragment>",`#include <map_fragment>
        float clumps = tNoise(tLocal * 1.6) * 0.6 + tNoise(tLocal * 4.3) * 0.4;
        ${n?`// The gaps' edges eased over a pixel (alpha to coverage), not cut
        // hard - a hard edge crawled as the crown swayed.
        float tCut = ${Je(Hi.top)} + ${Je(Hi.under-Hi.top)} * tUnder;
        float tEdge = fwidth(clumps) + 1e-4;
        float tCover = smoothstep(tCut - tEdge, tCut + tEdge, clumps);
        if (tCover <= 0.0) discard;
        diffuseColor.a *= tCover;`:""}
        // (Toned down beyond about 60 m, where it read as noise.)
        diffuseColor.rgb *= mix(0.78 + 0.4 * clumps, 0.97, smoothstep(45.0, 90.0, length(vViewPosition)));
        ${r?`// Its kind's leaves over it (CROWN_LEAVES), from the side it faces most.
        vec3 tAbs = abs(tFace);
        vec2 tQ = (tAbs.y >= tAbs.x && tAbs.y >= tAbs.z ? tAt.xz : tAbs.x >= tAbs.z ? tAt.zy : tAt.xy) / ${Je(dr.span)};
        vec2 tCellSize = vec2(${Je(1/at.cols)}, ${Je(1/at.rows)});
        vec2 tUv = vCell + (0.02 + fract(tQ) * 0.96) * tCellSize;
        vec4 tLeaf = textureGrad(tLeaves, tUv, dFdx(tQ) * tCellSize, dFdy(tQ) * tCellSize);
        vec3 tWorn = mix(vec3(${Je(dr.between)}), tLeaf.rgb / vec3(${dr.average.map(Je).join(", ")}) * ${Je(dr.bright)}, smoothstep(0.2, 0.6, tLeaf.a));
        diffuseColor.rgb *= mix(tWorn, vec3(1.0), smoothstep(${Je(dr.fade[0])}, ${Je(dr.fade[1])}, length(vViewPosition)));`:""}`).replace("#include <alphamap_fragment>",`#include <alphamap_fragment>
        ${t?"diffuseColor.rgb = mix(diffuseColor.rgb, vBark.rgb, vBark.a);":""}`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * ${Je(Gh)} * tUnder${t?" * (1.0 - vBark.a)":""};`)},e.customProgramCacheKey=()=>`leafy-crown-v6-${n?"g":"s"}${t?"b":""}`,zn(e,"crown"),on(e,"crown",{gaps:n?Hi:null,bark:t,glow:Gh,leaves:r?{map:r,cols:at.cols,rows:at.rows,...dr}:null})}var mp=e=>Math.min(1,Math.max(0,(e-qo[0])/(qo[1]-qo[0]))),kh=mp(1),$i={across:.82,up:.92},sE=.68,ql=e=>gn[e]?.under??sE;function Zl(e,n=1,t=1){if(!e)return{r:0,y:0};if(!e.userData.reach){let i=e.attributes.position,a=0,s=0;for(let l=0;l<i.count;l++)a=Math.max(a,Math.hypot(i.getX(l),i.getZ(l))),s=Math.max(s,Math.abs(i.getY(l)));e.userData.reach={r:a,y:s}}let{r,y:o}=e.userData.reach;return{r:r*n,y:o*t}}function gp(e){if(!e)return null;if(!e.userData.hull){let n=e.attributes.position,t=[];for(let r=0;r<n.count;r++)t.push([n.getX(r),n.getZ(r)]);e.userData.hull=Float32Array.from(Hc(t).flat())}return e.userData.hull}var lE=.14,cE=.035,gn={pine:{bark:"bark",texture:"pine",tex:"plates"},leaf:{bark:"bark",texture:"leaf",cards:24,size:1.22,boughs:!0,ends:{near:5,close:8,droop:.4,under:-.7,radius:[.5,.7]}},birch:{bark:"barkBirch",texture:"birch",cards:46,closeCards:30,size:1.18,drawn:{cards:30,size:1.18},trunk:"birch",tex:"birch"},willow:{bark:"barkWillow",texture:"willowleaf",cards:24,size:1.13,under:.85,ends:{near:3,close:5,droop:.5,up:.1}},poplar:{bark:"barkPoplar",texture:"poplar",cards:36,closeCards:27,size:1.3,drawn:{cards:27,size:1.22},ends:{near:3,close:5,droop:-.3,up:1.6,radius:[.36,.48]}},bush:{bark:"bark",texture:"bush",cards:21,size:1.22,crownDetail:1},scots:{bark:"barkScots",texture:"scots",trunk:"scots",tex:"plates"},oak:{bark:"barkOak",texture:"oak",cards:21,size:1.35,ends:{near:3.5,close:6,droop:.22,up:.55}},column:{bark:"bark",texture:"pine",tex:"plates"},spruce:{bark:"bark",texture:"spruce",tex:"plates"},snag:{bark:"barkSnag",texture:null},beech:{bark:"barkBeech",texture:"beech",trunk:"smooth",cards:44,closeCards:26,size:1.36,drawn:{cards:26,size:1.2},under:.82,tex:"plane",ends:{near:4.5,close:7,droop:.12,up:1.3,radius:[.46,.62]}},chestnut:{bark:"barkChestnut",texture:"chestnut",cards:22,size:1.42,under:.58,ends:{near:6,close:8,droop:.34,picture:"chestnutwhorl"}},cedar:{bark:"barkCedar",texture:"cedar",tex:"plates"},holly:{bark:"barkHolly",texture:"holly",cards:24,size:1,under:.85,tex:"plane",ends:{near:3.5,close:6,droop:.2,up:.3}},hawthorn:{bark:"barkHawthorn",texture:"hawthorn",cards:34,closeCards:20,size:1.15,drawn:{cards:20,size:1},under:.8,ends:{near:6,close:9,droop:.4,up:.3,under:-.9}}},jl=e=>Rc.has(ht[e]),Ql=e=>!!(e?.plates||e?.tall),Vh=0,zh=1,_p=new Set([3,5,7]),gr=null,_r=null,Wh=null,Hl=()=>({kinds:dt,shapes:dt.map((e,n)=>yc(n)),high:Ce,extra:wt,ultra:At,phone:Ot,leafScale:mn,atlas:[at.cols,at.rows,at.kinds.length],blossomCells:Yl,candles:na,haws:Yn,pictures:Object.keys(fr),ends:[Co,dt.map(e=>gn[e].ends??null)],crowns:dt.map(e=>gn[e].crownDetail??null),crownLeaves:1,...ko?{fine:ea.more}:{}});function i3(){return Wh??=Ch(ft,io(["tree shapes",Hl()])).then(e=>_r=e).catch(()=>null),Wh}var fE=e=>Object.fromEntries(Object.entries(e).map(([n,t])=>[n,t?{geometry:Di(t),atlas:t.userData.atlas??null,...t.userData.blossomCell!=null?{blossomCell:t.userData.blossomCell}:{},...t.userData.cardCorners!=null?{cardCorners:t.userData.cardCorners}:{},...t.userData.leafEnds?{leafEnds:t.userData.leafEnds}:{}}:null]));function uE(e){return Object.fromEntries(Object.entries(e).map(([n,t])=>{if(!t)return[n,null];let r=wl(t.geometry);return t.atlas&&(r.userData.atlas=t.atlas),t.blossomCell!=null&&(r.userData.blossomCell=t.blossomCell),t.cardCorners!=null&&(r.userData.cardCorners=t.cardCorners),t.leafEnds&&(r.userData.leafEnds=Uint32Array.from(t.leafEnds)),[n,r]}))}var dE=0;function vp(e,n){let t=_r?.find(e,Hl());if(t&&++dE===2&&!_r.changed&&(_r=null),t)return t.map(o=>o.map(uE));let r=n();return _r?.keep(e,Hl(),r.map(o=>o.map(fE))),r}function a3(){let e=_r;_r=null,e?.changed&&Lh(e)}function Jl(){return gr??=vp("tree shapes",Sp),gr}function Sp(){let e=hE();if(wt)for(let n of e)for(let t of n)t?.cardsClose&&sl(t.cardsClose);return e}function ec(e,n,t,r){let o=Cc(e,n);return t[o]??Ne(r+e*997+n*31)}function hE(){let e=Ne(334494),n=Ne(334495),t=Ne(334496),r=ro(),o=dt.map((i,a)=>r[i].map((s,l)=>{let c=ec(a,l,[e,n,t],334512),f=gn[i],u=wt?Ne(790622+dt.indexOf(i)*997+l*31):null;if(jl(i)){let L=Dn[f.tex]??0,F=Yr(s.trunk,f.trunk,f.tex),G=Ce?yE(s,L):null,H=s.tiers.map(([ke,,Xe,Ve,Y])=>[Ve,Xe,Y,ke]),X={trunk:G?Ge([F,G]):F,crown:mr(Ul(s.tiers,c),f.texture),cards:Ce?Pl(i,a,l,Wt(qr(s.tiers,c,{under:1}),H),s.tiers,{under:1},1):null};if(wt&&oo.has(a)&&!Ql(s)&&(X.cardsHeart=Pl(i,a,l,Wt(qr(Yo(s.tiers,a),Yi(a,l),{under:1,every:1/Ki(a)}),H),s.tiers,{under:1},2)),!u)return X;let $=Yr(s.trunk,f.trunk,f.tex,!0);X.trunkNear=G?Ge([$,G]):$;let j=wE(),Z=oo.has(a),ge=Z?Yo(s.tiers,a):s.tiers,_e=Z?j.every/(Fo.coreCardsOf[a]??Fo.coreCards):j.every;return{...X,limbs:$h(X.trunk,RE({...s,tiers:ge},u,L)),cardsClose:Pl(i,a,l,Wt(qr(ge,u,{...j,every:_e,deep:Kn.deep,under:1}),H),s.tiers,{...j,every:_e*1.3,deep:Kn.deep,under:1},3)}}if(s.snag)return{trunk:Yr(s.trunk,null,"furrowed",!1,!0),crown:null,cards:null,limbs:u?CE(s.trunk,u,Dn.furrowed??0):null};let d=i==="willow"?s.spheres.slice(0,s.spheres.length-s.curtain):s.spheres,h=fp(s,d),_=h.leafy,T=Ce&&h.heart.length?Wt(up(h.heart,Ne(24081+a*997+l*31)),d):null,p=i==="leaf"&&_p.has(l)?["plane","plane"]:[f.trunk,f.tex],m=i==="birch"?Fl:Vi,v=i==="birch",x=u?xp(s.trunk,_,u,Dn[p[1]]??0,v?.85:null,Ne(32284+dt.indexOf(i)*997+l*31),{plain:!v,limbs:!v}):null,g=wt&&jn.has(a)?Yi(a,l):null,E=Ce&&f.ends?{...Co,...f.ends}:null,b=L=>E?Wt(Uh(_,Ne(13313+a*997+l*31),Math.round(L*_.length),E),d):null,w=(L,F)=>{let G=f.boughs?gE(s.trunk,_,Dn[p[1]]??0,F):null;return G?Ge([L,G]):L},S=v?_E(s.trunk,_,p):w(Yr(s.trunk,...p),!1),A=x?.geometry&&!v?w(Yr(s.trunk,...p,!0),!0):null,C=(L,F)=>DE(dp(L,T),L?b(F):null,Xt(i,l),E?.picture??Xt(i,l)),P=s.shell&&!s.tall,D=L=>P?L:kl(a,L);Ce&&f.drawn&&m(_,f.drawn.cards,f.drawn.size,c,f.fill||0);let U=f.drawn?Ne(7855+a*997+l*31):c;return LE({trunk:S,trunkNear:A,crown:mr(Wi(Ce?_:d,c,!0,Ce?f.crownDetail??Vh:2,Ce?$i:null,Ce?zh:2),Xt(i,l)),cards:Ce?Wt(m(_,f.cards,f.size,U,f.fill||0,h.drop),d):null,limbs:A?$h(S,x.geometry):x?.geometry??null,cardsClose:u?Wt(vE(D(_),m,zi(Math.round((f.closeCards??f.cards)*(At?4.2:2.4)*(jn.has(a)?qi(a).cards:1))),tc(f.size*(At?.48:.64)*(jn.has(a)?qi(a).size:1)),u,f.fill||0,x.tips,h.drop),d):null,core:(u||g)&&jn.has(a)&&!v&&Qn[yn(a)].core<1?mr(Wi(D(_),u??g,!0,Ce?f.crownDetail??Vh:2,Ce?$i:null,Ce?zh:2),Xt(i,l)):null,cardsHeart:g?Wt(P?m(_,f.cards,f.size,g,f.fill||0,h.drop):m(kl(a,_),Math.max(3,Math.round(f.cards*Ki(a))),f.size*Bl(a),g,f.fill||0,h.drop),d):null,strands:i==="willow"?NE(s,c):null,blossom:Ce?s.flowering?Vl(Vi(IE(s.spheres).map(([L,F,G,H])=>[L,F,G,H*1.12]),22,.65,c),0):a===ht.chestnut?PE(_,Ne(13258014+l*31)):a===ht.hawthorn?Vl(Vi(_.map(([L,F,G,H])=>[L,F,G,H*1.1]),Yn.cards,Yn.size,Ne(18997+l*31)),0):null:null},C,E??Co)}));return o.forEach((i,a)=>i.forEach((s,l)=>[s.cards,s.cardsClose,s.cardsHeart].forEach(c=>No(c,Xt(dt[a],l))))),o}var pE=1,Ki=e=>(oo.has(e)?Fo.coreCardsOf[e]??Fo.coreCards:qi(e).cards)*pE,Yi=(e,n)=>Ne(322087+e*997+n*31),Bl=e=>Qn[yn(e)].core<1?qi(e).size:1,Xh={rings:2,sides:4},Un={tip:3,fork:2,small:1.4,out:[.72,.9],leaves:.35},mE={most:4,below:[2.4,4.2],thick:.5,tip:.32,into:.85,least:.3};function gE(e,n,t,r=!1,o=mE){if(!n.length)return null;let i=Math.min(...n.map(([,d,,h])=>d-h*.8)),a=n.filter(([d,h,_,T])=>Math.hypot(d,_)>T*.45&&h-T<i+2.5).map(d=>({l:d,a:Math.atan2(d[2],d[0])})).sort((d,h)=>d.a-h.a);if(!a.length)return null;let s=Math.min(o.most,a.length),l=Array.from({length:s},(d,h)=>a[Math.floor(h*a.length/s)].l),[c,f]=r?hr.branch:[5,5],u=l.map(([d,h,_,T],p)=>{let m=Math.max(i*o.least,i-o.below[0]-(o.below[1]-o.below[0])*(p*.618%1)),v=Math.min(.95,m/e.height),x=Rn(e,v),g=[d,h-T*o.into,_],E=[x[0]+(g[0]-x[0])*.35,x[1]+(g[1]-x[1])*.7,x[2]+(g[2]-x[2])*.35],b=S=>[0,1,2].map(A=>(1-S)*(1-S)*x[A]+2*S*(1-S)*E[A]+S*S*g[A]),w=Tr(e,v)*o.thick;return Et(b,S=>w*(1-(1-o.tip)*S),c,f,null,t,{under:S=>Ji(.45+.55*S)})});return Ge(u)}function $h(e,n){let t=Ge([e,n]);return t.userData.trunk=(e.index?e.index.count:e.attributes.position.count)/3,t}function _E(e,n,t){let r=xp(e,n,null,Dn[t[1]]??0,.85,null,{plain:!0}).geometry,o=Yr(e,...t);return r?Ge([o,r]):o}function xp(e,n,t,r,o,i,{plain:a=!1,limbs:s=!0}={}){let f=[],u=[],d=o==null?null:()=>o,h=(_,T,p,m,v,x,g)=>{let[E,b,w,S]=n[T];for(let A=0;A<v;A++){let C=p+(v>1?(A/(v-1)-.5)*2*m:0)+(i()-.5)*.6,P=x[0]+i()*(x[1]-x[0]),D=S*(Un.out[0]+i()*(Un.out[1]-Un.out[0])),U=Math.sqrt(1-P*P)*D,L=[E+Math.cos(C)*U,b+P*D,w+Math.sin(C)*U];f.push(Et(Zr(_,L),F=>Math.max(.008,g*(1-.7*F)),1,3,d,r)),u.push([...L,T])}};for(let[_,[T,p,m,v]]of n.entries()){let x=Dc(e,[T*1,p*1,m*1]);if(!x)continue;let{at:g,end:E,r0:b}=x;if(a){f.push(Et(g,H=>Math.max(.025,b*(1-.75*H)),Xh.rings,Xh.sides,d,r));continue}s&&f.push(Et(g,H=>Math.max(.025,b*(1-.75*H)),3,5,d,r));let w=g(.65),S=t()*Math.PI*2,A=[E[0]+Math.cos(S)*v*1*.6,E[1]+v*1*(.2+t()*.4),E[2]+Math.sin(S)*v*1*.6];f.push(Et(H=>[0,1,2].map(X=>w[X]+(A[X]-w[X])*H),H=>Math.max(.015,b*.4*(1-.7*H)),2,4,d,r));let C=g(.35),P=S+Math.PI*(.7+t()*.6),D=[E[0]+Math.cos(P)*v*1*.75,E[1]-v*1*(.15+t()*.25),E[2]+Math.sin(P)*v*1*.75],U=H=>[0,1,2].map(X=>C[X]+(D[X]-C[X])*H+(X===1?Math.sin(H*Math.PI)*v*.25:0));f.push(Et(U,H=>Math.max(.015,b*.5*(1-.7*H)),3,4,d,r));let L=v*1<Un.small?1:0,F=Math.max(.012,b*.22);h(E,_,i()*Math.PI*2,Math.PI*(1-1/Un.tip),Un.tip-L,[.35,.85],F),h((H=>[0,1,2].map(X=>w[X]+(A[X]-w[X])*H))(.55+i()*.3),_,S,.7,Un.fork-L,[0,.5],F*.8),h(U(.55+i()*.3),_,P,.7,Un.fork-L,[-.45,.1],F*.8)}return{geometry:f.length?Ge(f):null,tips:u}}function vE(e,n,t,r,o,i,a,s=null){let l=[];return e.forEach((c,f)=>{let u=a.filter(_=>_[3]===f),d=Array.isArray(t)?t[f]:t,h=u.length?Math.max(1,Math.round(d*Un.leaves/u.length)):0;l.push(n([c],d-h*u.length,r,o,i,s?(_,T,p,m)=>s(f,T,p,m):null)),h&&l.push(SE(c,u,h,r,o))}),Ge(l)}function SE(e,n,t,r,o){let[i,a,s,l]=e,c=[];for(let[f,u,d]of n)for(let h=0;h<t;h++){let _=r*l*(.7+o()*.45),T=new te(f+(o()-.5)*_*1.4,u+(o()-.5)*_,d+(o()-.5)*_*1.4),m=T.clone().sub(new te(i,a,s)).normalize().clone().add(new te(o()-.5,o()-.5,o()-.5).multiplyScalar(.9)).normalize(),v=new Ct(_,_),x=new Yt().setFromUnitVectors(new te(0,0,1),m);x.multiply(new Yt().setFromAxisAngle(new te(0,0,1),o()*Math.PI*2)),v.applyQuaternion(x),v.translate(T.x,T.y,T.z);let g=v.attributes.position,E=v.attributes.normal;for(let b=0;b<g.count;b++){let w=new te(g.getX(b)-i,g.getY(b)-a,g.getZ(b)-s).normalize();E.setXYZ(b,w.x,w.y,w.z)}c.push(v)}return sn(Ge(c),c.length,o,{low:3,high:8.5})}var ea={more:1.6},ko=wt&&!!Pn(Gt("effects",{}),ft).fineleaves,zi=e=>ko?Math.max(1,Math.round(e*ea.more)):e,tc=e=>ko?e/Math.sqrt(ea.more):e,An={cards:{ultra:{end:18,side:12,inner:8,size:.8},high:{end:11,side:7,inner:5,size:1}},out:.5,inner:.8,under:.86,coreCards:.6,coreSize:1.15,birch:{cards:{ultra:{end:25,side:17,inner:12,size:.46},high:{end:20,side:14,inner:10,size:.62}},coreCards:.55,coreSize:1.1},poplar:{cards:{ultra:{end:14,side:9,inner:7,size:.62},high:{end:9,side:6,inner:4,size:.78}},coreCards:.6,coreSize:1.15,style:"upright"},bush:{cards:{ultra:{end:7,side:5,inner:4,size:.36},high:{end:5,side:3,inner:3,size:.46}},coreCards:.7,coreSize:1.05,style:"shell"},willow:{cards:{ultra:{end:5,side:4,inner:3,size:.62},high:{end:4,side:3,inner:2,size:.78}},coreCards:.65,coreSize:1.1,style:"curtain"},small:{cards:{ultra:{end:12,side:8,inner:6,size:.5},high:{end:8,side:5,inner:4,size:.62}},coreCards:.62,coreSize:1.12}},Fo={cards:{ultra:{end:7,side:4,inner:4,size:1.15},high:{end:4,side:3,inner:3,size:1.4}},coreCards:.7,coreCardsOf:{[ht.scots]:.8,[ht.column]:.95}},ta=e=>e==="conifer"?Fo:An[e]??An,xE=(e="broad")=>{let n=ta(e).cards[At?"ultra":"high"];return ko?{...n,end:zi(n.end),side:zi(n.side),inner:zi(n.inner),size:tc(n.size)}:n},qi=e=>{let n=ta(yn(e));return{cards:n.coreCards,size:n.coreSize}},Bi={};function Gl(e="broad"){if(Bi[e])return Bi[e];let n=ca(e),t=xE(e),r=Qn[e].radius,o=e==="birch",i=e==="conifer",a=e==="snag",s=Dn[o?"birch":i?"plates":"furrowed"]??0,l=n.map(f=>{let[u,d,h]=f.branch,_=m=>[0,1,2].map(v=>(1-m)*(1-m)*u[v]+2*m*(1-m)*d[v]+m*m*h[v]),T=o?()=>.85:null,p=[Et(_,m=>r.base+(r.tip-r.base)*m,3,o||a?3:4,T,s)];for(let[m,v]of f.twigs)p.push(Et(Zr(m,v),x=>r.twig+(r.twigTip-r.twig)*x,1,3,T,s));return Ge(p)}),c=a?{}:Mp(e,t,Ep[e]??65372);for(let f of Object.values(c))for(let u of f)sl(u);return Bi[e]={bark:l,leaves:c},Bi[e]}var Ep={birch:728924,conifer:790364,poplar:40796,bush:745308,willow:16220,small:5922652};function Mp(e,n,t){let r=new Set;for(let a of Ar)if(yn(a)===e)for(let s=0;s<ro()[dt[a]].length;s++)r.add(Xt(dt[a],s));let o=e==="birch"?"cloud":ta(e).style??"shell",i=ca(e).map((a,s)=>e==="conifer"?bE(a,n,Ne(t+s*131)):o==="curtain"?TE(a,n,Ne(t+s*131)):ME(a,n,Ne(t+s*131),o));return Object.fromEntries([...r].map(a=>[a,i.map(s=>No(Object.assign(s.clone(),{userData:{}}),a))]))}var nc=(e,n,t)=>e.counts?e.counts[n]??0:n===0?e.end:n===t-1?e.inner:e.side,EE={mid:{counts:[3,2,2,1],grow:1.2,spread:[.15,.65],bush:{counts:[2,1,1,1],grow:1},willow:{counts:[2,1,1,0]},conifer:{counts:[2,1,1,1],grow:1}},far:{counts:[1,1,0,0],grow:1.25,spread:[0,.35],willow:{counts:[1,1,0,0],grow:1.2},conifer:{counts:[1,1,0,0],grow:1.1}}},Gi={};function Zi(e,n="mid"){let t=`${e}:${n}`;if(Gi[t])return Gi[t];let r=EE[n],o=r[e]??{},i=ta(e).cards.high,a=o.grow??r.grow,s={counts:o.counts??r.counts,spread:o.spread??r.spread,size:i.size*a};return Gi[t]={leaves:e==="snag"?{}:Mp(e,s,((Ep[e]??65372)^(n==="far"?4002:1053))>>>0)},Gi[t]}function ME(e,n,t,r="shell"){let o=r==="cloud",i=r==="upright",a=new te(...e.branch[0]),s=[],l=[],c=new te,f=new te,u=new te;e.clumps.forEach(([p,m,v,x],g)=>{let E=nc(n,g,e.clumps.length);c.set(p,m,v),u.copy(c).sub(a).normalize();for(let b=0;b<E;b++){let w=(b+.5)/E,S=Math.acos(1-2*w)+(t()-.5)*.4,A=b*2.39996+t()*.7,C=new te(Math.sin(S)*Math.cos(A),Math.cos(S),Math.sin(S)*Math.sin(A)),P=n.size*(.8+t()*.5),D=new Ct(P,o?P*(.8+t()*.3):P),U=new Yt().setFromUnitVectors(new te(0,0,1),C);U.multiply(new Yt().setFromAxisAngle(new te(0,0,1),t()*Math.PI*2)),D.applyQuaternion(U);let L=C.clone().multiplyScalar(x*(n.spread?n.spread[0]+(n.spread[1]-n.spread[0])*(o?Math.sqrt(t()):t()):o?.15+.85*Math.sqrt(t()):.3+t()*.7)).add(c);o&&(L.y=m+(L.y-m)*1.8),i&&(L.y=m+(L.y-m)*1.5),D.translate(L.x,L.y,L.z);let F=D.attributes.position,G=D.attributes.normal;for(let H=0;H<F.count;H++)o?f.set(F.getX(H)-p,(F.getY(H)-m)*.5+.45*x,F.getZ(H)-v).normalize().lerp(u,An.out*.6).normalize():f.set(F.getX(H)-p,F.getY(H)-m,F.getZ(H)-v).normalize().lerp(u,An.out).normalize(),G.setXYZ(H,f.x,f.y,f.z);s.push(D),l.push(g)}});let d=sn(Ge(s),s.length,t,{low:3,high:8.5}),h=d.attributes.position,_=d.attributes.color,T=h.count/s.length;for(let p=0;p<h.count;p++){let[m,v,x]=e.clumps[l[Math.floor(p/T)]];c.set(m,v,x),u.copy(c).sub(a).normalize(),f.set(h.getX(p)-m,h.getY(p)-v,h.getZ(p)-x).normalize();let g=(An.inner+(1-An.inner)*(.5+.5*f.dot(u)))*(An.under+(1-An.under)*(.5+.5*f.y));_.setXYZ(p,_.getX(p)*g,_.getY(p)*g,_.getZ(p)*g)}return d}function TE(e,n,t){let r=new te(...e.branch[0]),o=[];return e.clumps.forEach(([i,a,s,l],c)=>{let f=nc(n,c,e.clumps.length),u=Math.atan2(s-r.z,i-r.x);for(let d=0;d<f;d++){let h=u+(d-(f-1)/2)*.45+(t()-.5)*.3,_=i+Math.cos(h)*l*(.3+t()*.5),T=s+Math.sin(h)*l*(.3+t()*.5),p=n.size*(.85+t()*.3),m=p*1.15,v=2+Math.floor(t()*2),x=a+l*(.4+t()*.4);for(let g=0;g<v;g++){let E=new Ct(p*(1-g*.12),m);E.translate(0,x-m/2,0),E.rotateY(-h+Math.PI/2);let b=l*.12*g;E.translate(_+Math.cos(h)*b,0,T+Math.sin(h)*b);let w=E.attributes.normal;for(let S=0;S<w.count;S++){let A=new te(Math.cos(h),.25,Math.sin(h)).normalize();w.setXYZ(S,A.x,A.y,A.z)}o.push(E),x-=m*.82}}}),sn(Ge(o),o.length,t,{low:.4,high:7})}function bE(e,n,t){let r=new te(...e.branch[0]),o=[],i=new te,a=new te;e.clumps.forEach(([u,d,h,_],T)=>{let p=nc(n,T,e.clumps.length);i.set(u-r.x,0,h-r.z).normalize();let m=Math.atan2(i.z,i.x);for(let v=0;v<p;v++){let x=n.size*(.8+t()*.4),g=new Ct(x,x*.8);g.rotateX(-Math.PI/2+.45+t()*.25),g.translate(0,0,x*.2),g.rotateY(-(m+(t()-.5)*1.1)+Math.PI/2);let E=t()*Math.PI*2,b=_*(n.spread?n.spread[0]+(n.spread[1]-n.spread[0])*Math.sqrt(t()):Math.sqrt(t()));g.translate(u+Math.cos(E)*b,d+(t()-.6)*_*.5,h+Math.sin(E)*b);let w=g.attributes.position,S=g.attributes.normal;for(let A=0;A<w.count;A++)a.set(w.getX(A)-r.x,0,w.getZ(A)-r.z).normalize(),a.y=.6,a.normalize(),S.setXYZ(A,a.x,a.y,a.z);o.push(g)}});let s=sn(Ge(o),o.length,t,{low:1,high:10}),l=s.attributes.position,c=s.attributes.color,f=Math.max(.001,...e.clumps.map(([u,,d])=>Math.hypot(u-r.x,d-r.z)));for(let u=0;u<l.count;u++){let d=Math.min(1,Math.hypot(l.getX(u)-r.x,l.getZ(u)-r.z)/f),h=An.inner+(1-An.inner)*d;c.setXYZ(u,c.getX(u)*h,c.getY(u)*h,c.getZ(u)*h)}return s}function kl(e,n){return jn.has(e)?n.map(([t,r,o,i])=>[t,r,o,i*Qn[yn(e)].core]):n}var Ll=new Map;function Tp(e,n,t,r,o){let i=yn(e.kind),a=Qn[i],s=ro()[n][e.shape],l={close:[],near:[],far:[]};if(i==="snag"){let v=Gl(i).bark;for(let x of Nc(s,e.seed))l.near.push({role:"trunk",geometry:v[x.kit],matrix:e.matrix.clone().multiply(new qt().fromArray(x.matrix)),color:t.color,key:t.key});return l}let c=s.tiers?s.tiers.map(([v,,x,g,E])=>[g,x,E,v]):Lc(s),f=`${e.kind}:${e.shape}`;Ll.has(f)||Ll.set(f,bp(c));let u=Ll.get(f),d=Xt(n,e.shape),h=o?Gl(i):null,_=Zi(i,"mid").leaves[d],T=Zi(i,"far").leaves[d],p=new qt,m=i==="conifer"?Ic({trunk:s.trunk,tiers:s.tiers,plates:Ql(s)},e.seed,{kind:e.kind,toward:e.open}):Uc({trunk:s.trunk,dome:c},e.seed,{kind:e.kind,toward:e.open});for(let v of m){let x=e.matrix.clone().multiply(p.fromArray(v.matrix)),[g,E,b]=v.clumps[0],w=wp(u,g,E,b),[S,A,C]=u.tints?Ap(u,g,E,b):[1,1,1],P=1+v.shade*a.shade.light,D=v.shade*a.shade.warm,U=r.color.clone();U.setRGB(U.r*w*S*P*(1+D),U.g*w*A*P,U.b*w*1.03*C*P*(1-D)),h&&(l.close.push({role:"limbs",geometry:h.bark[v.kit],matrix:x,color:t.color,key:t.key}),l.close.push({role:"cardsClose",geometry:h.leaves[d][v.kit],matrix:x,color:U,key:r.key})),l.near.push({role:"cards",geometry:_[v.kit],matrix:x,color:U,key:r.key}),l.far.push({role:"far",geometry:T[v.kit],matrix:x,color:U,key:r.key})}return l}var Kn={arms:[5,9],reach:[.72,.88],cards:{ultra:{every:1/3,grow:.6},high:{every:1/2,grow:.72}},deep:[.3,.78]},wE=()=>{let e=Kn.cards[At?"ultra":"high"];return ko?{...e,every:e.every/ea.more,grow:tc(e.grow)}:e};function AE(e){let n=[0];for(let r=1;r<e.length;r++)n.push(n[r-1]+Math.hypot(e[r][0]-e[r-1][0],e[r][1]-e[r-1][1],e[r][2]-e[r-1][2]));let t=n.at(-1)||1;return r=>{let o=Math.min(1,Math.max(0,r))*t,i=1;for(;i<e.length-1&&n[i]<o;)i++;let a=(o-n[i-1])/(n[i]-n[i-1]||1);return[0,1,2].map(s=>e[i-1][s]+(e[i][s]-e[i-1][s])*a)}}var Zr=(e,n)=>t=>[0,1,2].map(r=>e[r]+(n[r]-e[r])*t);function RE(e,n,t){let{trunk:r,tiers:o}=e,i=[],a=Rn(r,1);for(let[s,l,c,f,u]of o){let d=c-l*.3,h=!e.plates&&d<=a[1]?Rn(r,Math.max(0,d/r.height)):[f,d,u],_=Math.round(Math.min(Kn.arms[1],Math.max(Kn.arms[0],s*2.4))),T=n()*Math.PI*2,p=Math.min(.09,.03+s*.018);for(let m=0;m<_;m++){let v=T+m/_*Math.PI*2+(n()-.5)*.5,x=s*(Kn.reach[0]+n()*(Kn.reach[1]-Kn.reach[0])),g=[f+Math.cos(v)*x,d-l*(.1+n()*.1),u+Math.sin(v)*x],E=[h[0]+(g[0]-h[0])*.45,Math.max(h[1],g[1])+l*.08,h[2]+(g[2]-h[2])*.45],b=w=>[0,1,2].map(S=>(1-w)*(1-w)*h[S]+2*w*(1-w)*E[S]+w*w*g[S]);if(i.push(Et(b,w=>Math.max(.012,p*(1-.8*w)),2,3,null,t)),n()<.7){let w=b(.5),S=v+(n()<.5?-1:1)*(.5+n()*.4),A=x*.35;i.push(Et(Zr(w,[w[0]+Math.cos(S)*A,w[1]-l*.06,w[2]+Math.sin(S)*A]),C=>Math.max(.01,p*.45*(1-.7*C)),1,3,null,t))}}}return Ge(i)}function yE(e,n){let{trunk:t,tiers:r}=e;if(e.plates)return null;let o=Rn(t,1),i=r.reduce((c,f)=>f[2]+f[1]*.5>c[2]+c[1]*.5?f:c),a=[o,...[...r].sort((c,f)=>c[2]-f[2]).filter(c=>c[2]>o[1]+.3).map(([,,c,f,u])=>[f,c,u])],s=i[2]+i[1]*.2;if(s>a.at(-1)[1]+.3&&a.push([i[3],s,i[4]]),a.length<2)return null;let l=Tr(t,1);return Et(AE(a),c=>Math.max(.02,l*(1-.85*c)),Math.max(2,(a.length-1)*2),6,null,n)}function CE(e,n,t){let r=[];for(let s of e.branches){let l=n()<.6?2:1;for(let c=0;c<l;c++){let f=.55+n()*.3,u=br(e,s,f),d=s.b+(n()-.5)*1.6,h=s.len*(.18+n()*.12),_=[u[0]+Math.cos(d)*h*.6,u[1]+h*(.6+n()*.35),u[2]+Math.sin(d)*h*.6],T=wr(s,f)*.55;r.push(Et(Zr(u,_),p=>Math.max(.012,T*(1-.75*p)),2,4,null,t))}}let o=3+Math.floor(n()*3);for(let s=0;s<o;s++){let l=.15+n()*.6,c=Rn(e,l),f=n()*Math.PI*2,u=Tr(e,l),d=u+.15+n()*.3;r.push(Et(Zr(c,[c[0]+Math.cos(f)*d,c[1]+d*(.2+n()*.4),c[2]+Math.sin(f)*d]),h=>u*.35*(1-.5*h),2,5,null,t))}let i=Rn(e,1),a=3+Math.floor(n()*3);for(let s=0;s<a;s++){let l=s/a*Math.PI*2+n()*.6,c=[i[0]+Math.cos(l)*e.r1*.6,i[1]-.15,i[2]+Math.sin(l)*e.r1*.6],f=.2+n()*.3;r.push(Et(Zr(c,[c[0]+Math.cos(l)*.06,c[1]+f,c[2]+Math.sin(l)*.06]),u=>Math.max(.006,e.r1*.35*(1-u)),2,3,null,t))}return Ge(r)}var vr={heart:.62,under:.72,round:.5,patch:.09};function bp(e){let n=0,t=0,r=0;for(let[l,c,f]of e)n+=l/e.length,t+=c/e.length,r+=f/e.length;let o=0,i=1/0,a=-1/0;for(let[l,c,f,u]of e)o=Math.max(o,Math.hypot(l-n,c-t,f-r)+u),i=Math.min(i,c-u),a=Math.max(a,c+u);let s=vr.patch&&e.length>1?e.map(([l,c,f])=>{let d=(Math.abs(Math.sin(l*12.9898+c*78.233+f*37.719)*43758.5453)%1*2-1)*vr.patch;return[1+d*1.2,1+d*.5,1-d*1.4]}):null;return{cx:n,cy:t,cz:r,reach:o,lo:i,hi:a,tints:s,dome:e}}function wp(e,n,t,r){let o=Math.min(1,Math.hypot(n-e.cx,t-e.cy,r-e.cz)/(e.reach||1)),i=Math.min(1,Math.max(0,(t-e.lo)/(e.hi-e.lo||1)));return(vr.heart+(1-vr.heart)*o**1.5)*(vr.under+(1.08-vr.under)*i)}function Ap(e,n,t,r){let o=0,i=1/0;for(let a=0;a<e.dome.length;a++){let s=e.dome[a],l=s[3]||1,c=n-s[0],f=t-s[1],u=r-s[2],d=(c*c+f*f+u*u)/(l*l);d<i&&(i=d,o=a)}return e.tints[o]}function Wt(e,n){if(!e||!n.length)return e;let t=bp(n),r=e.attributes.position,o=e.attributes.color;for(let a=0;a<r.count;a++){let s=wp(t,r.getX(a),r.getY(a),r.getZ(a));o.setXYZ(a,Math.min(1,o.getX(a)*s),Math.min(1,o.getY(a)*s),Math.min(1,o.getZ(a)*s*1.03))}if(t.tints)for(let a=0;a<r.count;a++){let[s,l,c]=Ap(t,r.getX(a),r.getY(a),r.getZ(a));o.setXYZ(a,Math.min(1,o.getX(a)*s),Math.min(1,o.getY(a)*l),Math.min(1,o.getZ(a)*c))}let i=e.attributes.normal;if(i){let a=new te,s=new te;for(let l=0;l<r.count;l++)s.set(r.getX(l)-t.cx,r.getY(l)-t.cy,r.getZ(l)-t.cz).normalize(),a.set(i.getX(l),i.getY(l),i.getZ(l)).lerp(s,vr.round).normalize(),i.setXYZ(l,a.x,a.y,a.z)}return e}function Vl(e,n,t=128*mn){if(!e||e.userData.blossomCell!=null)return e;let r=e.attributes.uv,o=.5/t;for(let i=0;i<r.count;i++)r.setX(i,(n+o+r.getX(i)*(1-2*o))/Yl);return r.needsUpdate=!0,e.userData.blossomCell=n,e}var na={most:24,apart:1.25,from:.12,out:1.07,height:1.12,width:.62,sunk:.12,lean:.22,share:.8,pink:.14,lit:.55,low:.74};function PE(e,n){let t=na,r=[];for(let[l,c,f,u]of e){let d=Math.max(6,Math.round(u*u*3.2));for(let h=0;h<d;h++){let _=t.from+(1-t.from)*((h+n())/d),T=h*2.39996+n()*.8,p=Math.sqrt(Math.max(0,1-_*_)),m=[p*Math.cos(T),_,p*Math.sin(T)],v=[l+m[0]*u*t.out,c+m[1]*u*t.out,f+m[2]*u*t.out];e.some(([x,g,E,b])=>(x!==l||g!==c||E!==f)&&Math.hypot(v[0]-x,v[1]-g,v[2]-E)<b*1.04)||r.push({at:v,dir:m,pick:n()})}}r.sort((l,c)=>l.pick-c.pick);let o=[],i=Math.round(t.most*Math.min(4,Math.max(1,e.length/19)));for(let l of r){if(o.length>=i)break;o.every(c=>Math.hypot(c.at[0]-l.at[0],c.at[1]-l.at[1],c.at[2]-l.at[2])>=t.apart)&&o.push(l)}if(!o.length)return null;let a=new te(0,1,0),s=[];for(let{at:l,dir:c}of o){let f=.85+n()*.35,u=n()*Math.PI,d=new te(c[0],0,c[2]),h=d.lengthSq()>1e-6?new te().crossVectors(a,d.normalize()):new te(1,0,0),_=new Yt().setFromAxisAngle(h.normalize(),t.lean*(1-c[1])),T=new te(c[0]*t.lit,1,c[2]*t.lit).normalize(),p=(.9+n()*.1)*(t.low+(1-t.low)*c[1]);for(let m of[0,Math.PI/2]){let v=new Ct(t.width*f,t.height*f);v.translate(0,t.height*f*.5-t.sunk,0),v.rotateY(u+m),v.applyQuaternion(_),v.translate(l[0],l[1],l[2]);let x=v.attributes.normal;for(let g=0;g<x.count;g++)x.setXYZ(g,T.x,T.y,T.z);v.setAttribute("color",new Ie(new Float32Array(x.count*3).fill(p),3)),s.push(v)}}return Vl(Ge(s),1)}function LE(e,n,t){return e.cards&&(e.cards=n(e.cards,t.near)),e.cardsHeart&&(e.cardsHeart=n(e.cardsHeart,t.near)),e.cardsClose&&(e.cardsClose=n(e.cardsClose,t.close)),e}function DE(e,n,t,r){if(!e||!n)return e;No(e,t),No(n,r);let o=Ge([e,n]);return o.userData.atlas=t,o.userData.cardCorners=e.attributes.position.count,o}var Yn={cards:5,size:.36,may:.9,pink:.12,haws:.55,autumn:.85,dull:.5};function UE(e,n,t){if(e===ht.chestnut){let r=Ne(n^13258014);return{color:Rp(r),on:(t==="summer"||t==="spring")&&r()<na.share}}if(e===ht.hawthorn){let r=Ne(n^18997),o=new ye;return t==="spring"?(r()<Yn.pink?o.setHSL(.94+r()*.03,.5,.82):o.setHSL(.14,.2+r()*.15,.93),{color:o,on:r()<Yn.may}):(o.setHSL((.985+r()*.03)%1,.62+r()*.12,(.36+r()*.07)*Yn.dull),{color:o,on:r()<(t==="autumn"?Yn.autumn:Yn.haws)})}return null}function Rp(e,n=new ye){return e()<na.pink?n.setHSL(.955+e()*.03,.5+e()*.15,.7+e()*.06):n.setHSL(.13+e()*.03,.3+e()*.2,.9+e()*.04)}function IE(e){let n=e.reduce((t,r)=>t+r[1],0)/e.length;return e.filter(t=>t[1]>=n-.05)}function NE(e,n){let t=[],r=e.spheres.slice(0,e.spheres.length-e.curtain);for(let[o,i,a,s]of r){let l=Math.atan2(a,o),c=7;for(let f=0;f<c;f++){let u=l+(f-(c-1)/2)*.24+(n()-.5)*.2,d=o+Math.cos(u)*s*(.5+n()*.28),h=a+Math.sin(u)*s*(.5+n()*.28),_=i+s*(.2+n()*.35),T=_-(.4+n()*.45),p=n()<.4?T*(.28+n()*.3):T,m=_-p;if(p<1.2)continue;let v=.95+n()*.5,x=new Ct(v,p,1,5),g=x.attributes.position,E=s*(.18+n()*.3);for(let A=0;A<g.count;A++){let C=g.getY(A)/p+.5;g.setX(A,g.getX(A)*(.82+.35*C)),g.setZ(A,Math.sin((1-C)*Math.PI*.55)*E)}x.translate(0,(_+m)/2,0),x.rotateY(-u+Math.PI/2),x.translate(d,0,h);let b=x.attributes.uv,w=Math.max(2,p/.9);for(let A=0;A<b.count;A++)b.setY(A,b.getY(A)*w);let S=x.attributes.normal;for(let A=0;A<g.count;A++){let C=new te(g.getX(A),.25,g.getZ(A)).normalize();S.setXYZ(A,C.x,C.y,C.z)}t.push(x)}}return t.length?sn(Ge(t),t.length,n,{low:.4,high:7}):null}var Pt={cardShare:.25,cardGrow:1.9,birchGrow:1.8,pineEvery:3,pineGrow:1.5,sides:6,rings:3};function OE(e,n,t,r=ht[e],o=0){let i=gn[e],a=Dn[i.tex??"furrowed"]??0,s=e==="birch"||e==="beech"?pp:Ji,l=(P,D,U,L=1.05,F=s)=>Et(G=>Rn(P,G),G=>Tr(P,G)*L,D,U,null,a,{under:F});if(n.snag){let P=n.trunk.branches.map(D=>Et(U=>br(n.trunk,D,U),U=>wr(D,U)*1.2,1,4,null,a));return{trunk:Ge([l(n.trunk,Pt.rings,Pt.sides,1.1,null),...P]),crown:null,cards:null}}let c=n.trunk.branches.filter(P=>P.stem).map(P=>Et(D=>br(n.trunk,P,D),D=>wr(P,D)*1.05,Pt.rings,Pt.sides,null,a,{under:s})),f=c.length?Ge([l(n.trunk,Pt.rings,Pt.sides),...c]):l(n.trunk,Pt.rings,Pt.sides);if(jl(e)){let P=n.tiers.map(([U,,L,F,G])=>[F,L,G,U]),D={trunk:f,crown:mr(Ul(n.tiers,t,Pt.sides,!0),i.texture),cards:Ce?Wt(qr(n.tiers,t,{every:Pt.pineEvery,grow:Pt.pineGrow}),P):null};if(wt&&oo.has(r)&&!Ql(n)){let U=Yi(r,o),L=Yo(n.tiers,r);D.crownHeart=mr(Ul(L,U,Pt.sides,!0),i.texture),D.cardsHeart=Wt(qr(L,U,{every:Pt.pineEvery/Ki(r),grow:Pt.pineGrow}),P)}return D}let u=i.drawn??i,d=Math.max(3,Math.round((u.cards??12)*Pt.cardShare)),h=e==="willow"?n.curtain??0:0,_=n.spheres.slice(0,n.spheres.length-h),T=n.spheres.slice(n.spheres.length-h),p=fp(n,_),m=p.leafy,v=Ce&&p.heart.length?Wt(up(p.heart,Ne(24082+r*997+o*31)),_):null,x=(P,D,U=t)=>Vi(P,D,u.size*Pt.cardGrow*(U===t?1:Bl(r)),U,i.fill||0,P===m?p.drop:null),g=Ce?dp(Wt(e==="birch"?Fl(n.spheres,d+1,u.size*Pt.birchGrow,t):T.length?Ge([x(m,d),x(T,Math.max(2,d>>1))]):x(m,d),_),v):null,E=e==="birch"&&Ce?null:mr(Wi(Ce?[...m,...T]:n.spheres,t,!0,Ce?0:1,Ce?$i:null),Xt(e,o));if(!wt||!jn.has(r))return{trunk:f,crown:E,cards:g};if(n.shell&&!n.tall)return{trunk:f,crown:E,cards:g,cardsHeart:g,crownHeart:E};let b=Yi(r,o),w=kl(r,m),S=Math.max(2,Math.round(d*Ki(r))),A=Wt(e==="birch"?Fl(w,S+1,u.size*Pt.birchGrow*Bl(r),b):T.length?Ge([x(w,S,b),x(T,Math.max(2,d>>1),b)]):x(w,S,b),m),C=e==="birch"||Qn[yn(r)].core>=1?null:mr(Wi([...w,...T],b,!0,0,$i),Xt(e,o));return{trunk:f,crown:E,cards:g,cardsHeart:A,crownHeart:C}}var jr=null;function rc(){return jr??=vp("low tree shapes",yp),jr}function yp(){let e=Ne(4004),n=Ne(4005),t=Ne(4006),r=ro(),o=dt.map((i,a)=>r[i].map((s,l)=>OE(i,s,ec(a,l,[e,n,t],64176),a,l)));return o.forEach((i,a)=>i.forEach((s,l)=>[s.cards,s.cardsHeart].forEach(c=>No(c,Xt(dt[a],l))))),o}function Kh(e,n,t){let r=[["far",n.trunk,e.matrix,new ye(pt[gn[t].bark]),"bark"]];if(n.cards){n.crown&&r.push(["far",n.crown,e.matrix,e.color.clone().multiplyScalar(ql(t)),"crown"]);let o=Xt(t,e.shape);r.push(["far",n.cards,e.matrix,Go(e.color,o),Jr(o)])}else n.crown&&r.push(["far",n.crown,e.matrix,e.color,"crown"]);return r}var Qr=!0;function s3(e){Qr=!!e}function l3(){return Qr}var[qn,zl,Yh,qh]=[Ei,$s,Qu,Ju].map(e=>Ot?ju(e):e),eo=qn[ft];dn(2,"3D trees to 220 m",e=>eo=e?qn.medium:qn.high,{of:"high"});var Cp=()=>!Ot&&!!td[ft]&&eo===qn[ft];function c3(){return Cp()}var oc=new Set;function f3(e){return e&&(oc.add(e),e.visible=!cu(),e)}dn(1.5,"no neighbour trees",e=>{fu(e);for(let n of oc)n.visible=!e},{of:"high"});var Pp=!1,ra=!1,ic=()=>!wt||Pp?0:At&&!ra?zl.ultra:zl.high,FE=()=>ic()?At&&!ra?Yh.ultra:Yh.high:0,HE=()=>At&&!ra?qh.ultra:qh.high,BE=()=>!Ot&&At&&!!ed.ultra&&ic()===zl.ultra;dn(2,"close-up trees to 45 m",e=>ra=e,{of:"ultra"});dn(.75,"no close-up trees",e=>Pp=e,{of:"high"});dn(2,"simpler far trees",e=>{eo=e?qn.standard:qn.medium});dn(2.6,"3D trees only near the shot",e=>{eo=e?qn.least:qn.standard});var ac=.2;function Zh(e,n="cards"){let t=Jr(e)==="leaves"?[at.cols,at.rows]:[1,1];return np({map:Nl(e),vertexColors:!0,alphaToCoverage:!0,alphaTest:ac},n,t)}function u3(e,{groundY:n=()=>0,seed:t=11,shadows:r=!0,forms:o=null,farOnly:i=!1,front:a=null,own:s=null,facing:l=null}={}){let c=new hs,f=Ce,u=i?null:Jl(),d=i?rc():null,h=new Yt,_=new Yt,T=new te(0,1,0),p=new te,m=[],v=Eh(e),x=e.map((E,b)=>{let w=o?.[b]??Oc(E),[S,A]=E,C=Number.isInteger(w.shape)?w.shape%((i?d:u)[w.kind]?.length??bc):0;h.setFromAxisAngle(T,w.yaw??0),_.setFromAxisAngle(p.set(Math.cos(w.leanA??0),0,Math.sin(w.leanA??0)),w.lean??0);let P=new qt().compose(new te(S,n(S,A)-.2,A),_.clone().multiply(h),new te(w.w*(w.sx??1),w.h,w.w*(w.sz??1))),D=mp(w.thick??1),U=w.seed??fa([S,A]),L=pr(dt[w.kind]??"leaf",Ne(U^29095)),F=Ne(U^2317)();if((w.kind===ht.leaf||w.kind===ht.oak)&&F<jx.share&&(L=pr("accent",Ne(U^11325015))),wn&&Qx.has(w.kind)){let J=Ne(U^24229),Ee=J();Ee<wn.turn?L=pr("autumn",J):Ee<wn.turn+wn.brown?L=pr("dead",J):ml(L,"leaves")}let G=L.clone().offsetHSL(cE*(D-kh),f?0:.1,lE*(kh-D)),H=Mh(xh(S,A),v[b]);G.offsetHSL(H.hue,H.sat,H.light);let X=UE(w.kind,U,wn?.name??"summer"),$=X?X.color:pr("bush",Ne(U^11601232),new ye,hp),j=!X||X.on,Z=i?null:u[w.kind]?.[C],ge=Z?[Z.crown,Z.cards,Z.cardsHeart,Ce?Z.strands:null,w.kind===ht.chestnut||w.kind===ht.hawthorn?null:Z.blossom,Z.crown?null:Z.trunk]:[],_e=Z?ge.map(J=>Zl(J)):[{r:.65,y:.9}],ke=!!Z&&!(wt&&Ar.has(w.kind)),Xe={r:Math.max(0,..._e.map(J=>J.r)),y:Math.max(0,..._e.map(J=>J.y)),...ke?{hull:ge.flatMap(J=>J?[...gp(J)]:[])}:{}},Ve=Fc(w,Xe),Y=n(S,A)-.2;return m.push({x:S,z:A,kind:dt[w.kind],width:w.w??1,seed:U}),{kind:w.kind,shape:C,matrix:P,color:G,thick:D,blossom:$,flowers:j,seed:U,open:w.open??null,crown:{x:S,z:A,r:Ve.r,top:Y+Ve.top},height:Ve.top}});if(!i&&wt&&Tn.on[ft]&&Qr){let E=rd(Float32Array.from(x.flatMap(b=>[b.crown.x,b.crown.z,b.height,b.crown.r])),{facing:l});x.forEach((b,w)=>b.buried=E[w]===1)}c.userData.crowns=x.map(E=>E.crown),c.userData.kinds={};for(let E of x)c.userData.kinds[dt[E.kind]]=(c.userData.kinds[dt[E.kind]]??0)+1;let g={leafMat:aE(new En({color:f?10135696:14476752,vertexColors:!0}),f),cardMats:{leaves:Zh("leaf"),willow:Zh("willow","strands"),blossom:np({map:cp(),vertexColors:!0,alphaToCoverage:!0,alphaTest:ac})}};for(let E of Object.values(g.cardMats))E.userData.seeThrough="leaves";return f&&(g.leafMat.userData.seeThrough="leaves"),i||Qr?GE(c,x,u,g,r&&!i,i,a,s):KE(c,x,u,g,r),Ce&&!i&&(c.userData.feet=wh(m,n)),c}function Lp(e,n,t){let r=[["trunk",n.trunk,e.matrix,new ye(pt[gn[t].bark]),"bark"]];if(n.cards){t!=="birch"&&!jl(t)&&r.push(["crown",n.crown,e.matrix,e.color.clone().multiplyScalar(ql(t)),"crown"]);let o=Xt(t,e.shape);r.push(["cards",n.cards,e.matrix,Go(e.color,o),Jr(o)]),Ce&&n.strands&&r.push(["strands",n.strands,e.matrix,e.color.clone().lerp(new ye(1,1,.9),.4),"willow"]),n.blossom&&e.flowers!==!1&&r.push(["blossom",n.blossom,e.matrix,e.blossom,"blossom"])}else n.crown&&r.push(["crown",n.crown,e.matrix,e.color,"crown"]);return r}function GE(e,n,t,r,o,i=!1,a=null,s=null){let l=rc(),c=new Map,f=n.map(h=>Hp(h,t,l,i)),u=[...new Set(n.map(h=>h.kind))],d=h=>h==="bark"?XE():h==="crown"?r.leafMat:r.cardMats[h];for(let h of f)for(let _ of i?h.far:lc(h)){let T=c.get(_.key);T||c.set(_.key,T={key:_.key,material:d(_.key),geometries:new Map,parts:[]}),T.geometries.has(_.geometry)||T.geometries.set(_.geometry,-1),T.parts.push(_)}for(let h of c.values()){let _=kE(u).get(h.key),T=!!_&&[...h.geometries.keys()].every(v=>_.ids.has(v)),p=T?new Qi(h.parts.length,_,h.material):Dp(h);if(T)for(let v of h.geometries.keys())h.geometries.set(v,_.ids.get(v));p.userData.role=(h.parts.find(v=>v.role!=="far")??h.parts[0]).role;let m=[];for(let v of h.parts){let x=p.addInstance(h.geometries.get(v.geometry));p.setMatrixAt(x,v.matrix),p.setColorAt(x,v.color),p.setVisibleAt(x,i||Ks(v.role,{boughs:!1},v)),v.mesh=p,v.id=x;let g=v.geometry.userData.leafEnds;g&&sc(h.key)&&m.push({id:x,x:v.matrix.elements[12],y:v.matrix.elements[13],z:v.matrix.elements[14],ends:g})}Gd(p,m),p.sortObjects=h.key==="crown"&&!Ce,p.castShadow=o&&h.key!=="blossom",h.key==="blossom"&&(p.userData.blossom=!0),h.key==="bark"&&(p.userData.trunk=!0),e.add(p)}i||(e.userData.detail=new Xl(e,n,f,a,s))}var sc=e=>wt&&e!=null&&e!=="bark"&&e!=="crown"&&e!=="willow"&&e!=="blossom";function Dp(e){let n=0,t=0;if(sc(e.key))for(let o of e.geometries.keys())ll(o);for(let o of e.geometries.keys())n+=o.attributes.position.count,t+=o.index?o.index.count:0;let r=new fi(e.parts.length,n,Math.max(1,t),e.material);for(let o of e.geometries.keys())e.geometries.set(o,r.addGeometry(o));return r}var In=null,Ho=new Set,jh=new Set,Up=new Set,Ip=!1,Bo=new Set,Np=dt.map((e,n)=>n);function d3(e){Ip=!0;for(let t of e)Up.add(t);if(!In||!Qr)return!1;let n=Wl(e);return ji(),n}function kE(e=Np){return In?e.some(n=>!Ho.has(n))&&(Wl(e),ji()):(In=new Map,Wl([...Up,...e]),ji()),In}function Wl(e){let n=[...new Set(e)].filter(r=>dt[r]!=null&&!Ho.has(r));if(!n.length)return!1;Op(n);let t=wt?[...new Set(n.filter(r=>Ar.has(r)).map(yn))].filter(r=>!jh.has(r)):[];for(let[r,o]of VE(n,t)){let i=In.get(r),a=[...o].filter(s=>!i?.ids.has(s));if(a.length)try{if(i)zE(i,a,r);else{let s={key:r,geometries:new Map(a.map(l=>[l,-1])),parts:[null]};In.set(r,{store:Dp(s),ids:s.geometries})}}catch(s){console.warn(`Trees: the ${r} shapes kept in each batch (${s.message})`)}}for(let r of n)Ho.add(r);for(let r of t)jh.add(r);return!0}function VE(e,n){let t=Jl(),r=rc(),o=new Map,i=(a,s)=>{o.has(a)||o.set(a,new Set),o.get(a).add(s)};for(let a of e)t[a].forEach((s,l)=>{for(let c of[!1,!0]){let f={kind:a,shape:l,matrix:new qt,color:new ye,thick:1,blossom:new ye,seed:1,buried:c};for(let u of lc(Hp(f,t,r,!1)))i(u.key,u.geometry)}});for(let a of n)for(let s of[Gl(a),Zi(a,"mid"),Zi(a,"far")]){if(s.bark)for(let l of s.bark)i("bark",l);for(let[l,c]of Object.entries(s.leaves))for(let f of c)i(Jr(l),f)}return o}function zE(e,n,t=null){let r=e.store,o=0,i=0;if(sc(t))for(let a of n)ll(a);for(let a of n)o+=a.attributes.position.count,i+=a.index?a.index.count:0;r.setGeometrySize(r._maxVertexCount+o,r._maxIndexCount+i);for(let a of n)e.ids.set(a,r.addGeometry(a))}function Op(e){let n=e.filter(i=>Bo.has(i));if(!n.length)return;let t=Sp(),r=yp(),o=(i,a)=>i.forEach((s,l)=>{for(let[c,f]of Object.entries(s)){let u=a[l]?.[c];if(!(!f||!u)){for(let[d,h]of Object.entries(u.attributes))f.setAttribute(d,h);u.index&&f.setIndex(u.index),f.userData.gone=!1,f.userData.idle=!1}}});for(let i of n)o(gr[i],t[i]),jr&&o(jr[i],r[i]),Bo.delete(i)}var Fp=!1;function h3(){Fp=!0,ji()}function ji(){if(!Fp||!In||!Qr||!gr)return;for(let n of gr)for(let t of n)for(let r of[t.crown,t.cards,t.cardsHeart,t.strands,t.blossom,t.trunk])r&&(Zl(r),wt||gp(r));let e=n=>{for(let[t,r]of Object.entries(n.attributes))n.setAttribute(t,new Ie(new r.array.constructor(0),r.itemSize,r.normalized));n.index&&n.setIndex(new Ie(new n.index.array.constructor(0),1))};for(let{ids:n}of In.values())for(let t of n.keys())t.userData.onShelf||(t.userData.onShelf=!0,e(t));for(let n of Ho)for(let t of[...gr[n],...jr?.[n]??[]])for(let r of Object.values(t))!r||r.userData.onShelf||r.userData.idle||(r.userData.idle=!0,e(r));if(Ip){for(let n of Np)if(!(Ho.has(n)||Bo.has(n))){for(let t of[...gr[n],...jr?.[n]??[]])for(let r of Object.values(t))!r||r.userData.onShelf||r.userData.gone||r.userData.idle||(r.userData.gone=!0,e(r));Bo.add(n)}}}function p3(){Op([...Bo]);for(let{store:e,ids:n}of In?.values()??[]){let t=e.geometry;for(let[r,o]of n){if(!r.userData.onShelf)continue;let i=e.getGeometryRangeAt(o);for(let[a,s]of Object.entries(t.attributes))r.setAttribute(a,new Ie(s.array.slice(i.vertexStart*s.itemSize,(i.vertexStart+i.vertexCount)*s.itemSize),s.itemSize,s.normalized));t.index&&r.setIndex(new Ie(t.index.array.slice(i.indexStart,i.indexStart+i.indexCount).map(a=>a-i.vertexStart),1)),r.userData.onShelf=!1}}}var WE=["geometry","_geometryInfo","_geometryCount","_nextVertexStart","_nextIndexStart"],Qi=class extends fi{constructor(n,t,r){let o=t.store;super(n,o._maxVertexCount,o._maxIndexCount,r),this.shelf=t,this._geometryInitialized=!0}dispose(){this.shelf=null,this._own.geometry=new xt,super.dispose()}};for(let e of WE)Object.defineProperty(Qi.prototype,e,{get(){return this.shelf?this.shelf.store[e]:this._own?.[e]},set(n){this._own||Object.defineProperty(this,"_own",{value:{},writable:!0}),this.shelf||(this._own[e]=n)}});function Hp(e,n,t,r){let o=dt[e.kind],i=r?null:n[e.kind][e.shape],a=t[e.kind][e.shape],s=wt&&e.seed!=null&&Ar.has(e.kind),l=i?Lp(e,i,o).map(([v,x,g,E,b])=>({role:v,geometry:x,matrix:g,color:E,key:b})):[],c=l.find(v=>v.role==="cards"),f=l.find(v=>v.role==="trunk"),u=l.find(v=>v.role==="crown"),d=s&&!!e.buried&&!!i;if(d){u&&Object.assign(u,{worn:!0,geometry:i.core??u.geometry}),c&&i.cardsHeart&&Object.assign(c,{worn:!0,geometry:i.cardsHeart});for(let v of l)v.role==="strands"&&(v.worn=!0);for(let[v,x,g,E,b]of Kh(e,a,o).slice(1))l.push({role:v==="far"?b==="crown"?"crown":"cards":v,geometry:x,matrix:g,color:E,key:b,plain:!0})}else s?(u&&i.core&&(u.geometry=i.core),c&&i.cardsHeart&&(c.geometry=i.cardsHeart)):u&&i?.core&&(u.nearOnly=!0);let h=Xt(o,e.shape),_=s?Tp(e,o,{color:f?.color??new ye(pt[gn[o].bark]),key:"bark"},{color:c?.color??Go(e.color,h),key:Jr(h)},!r&&!!i.limbs&&(c?!!i.cardsClose:!0)):null;i&&l.push(...(_?.near??[]).map(v=>d?{...v,worn:!0}:v));let T=!r&&i.limbs&&i.trunkNear&&f,p=!r&&i.limbs?[{...f,role:"limbs",geometry:i.limbs},...i.cardsClose&&c?[{...c,role:"cardsClose",geometry:i.cardsClose}]:[],...!s&&u&&i.core?[{...u,role:"core",geometry:i.core,nearOnly:!1}]:[],..._?.close??[]]:null;T&&Object.assign(f,{geometry:i.trunkNear,nearOnly:!0});let m=Kh(e,s&&!d?{...a,crown:a.crownHeart??a.crown,cards:a.cardsHeart??a.cards}:a,o).map(([v,x,g,E,b])=>({role:v,geometry:x,matrix:g,color:E,key:b}));return a.cards&&!d&&m.push(..._?.far??[]),{near:l,close:p,far:m}}function lc(e){return e.close?[...e.near,...e.close,...e.far]:[...e.near,...e.far]}function XE(){return Bp(new En({color:16777215,vertexColors:!0}))}function Bp(e){e.userData.seeThrough="trunk";let n=zn(iE(e),"trunk");return Ce?on(n,"bark",{tBark:Ao().tBark}):n}var Qh={leaf:"#87b261",pine:"#7dba6f",oak:"#87b261",birch:"#a4c878",poplar:"#7eaa58",bush:"#8fb868",willowleaf:"#9cb86a",willow:"#9cb86a",plane:"#87b261",chestnut:"#87b261",chestnutwhorl:"#87b261",holly:"#87b261",hawthorn:"#87b261",beech:"#87b261",spruce:"#7dba6f",scots:"#7dba6f",cedar:"#7dba6f"};var $E=new ye(1,1,.95),ki={h:0,s:0,l:0};function Go(e,n="leaf",t=new ye){let r=new ye(Qh[n]??Qh.leaf);e.clone().lerp($E,.45).multiply(r).getHSL(ki);let{s:i,l:a}=ki;return e.getHSL(ki),t.setHSL(ki.h,i,a),t.setRGB(t.r/r.r,t.g/r.g,t.b/r.b)}function m3(){let e=Jl(),n=Ne(684453),t=Ne(684454),r=Ne(684455),o=new ye(Ce?10135696:14476752),i=new qt;return dt.map((a,s)=>e[s].map((l,c)=>{let f=ec(s,c,[n,t,r],684464),u=pr(a,f),d=Ce?u:u.clone().offsetHSL(0,.1,0),h=pr("bush",f,new ye,hp);s===ht.chestnut&&Rp(Ne(13258014+c*31+7),h);let _=[{role:"trunk",geometry:l.trunk,matrix:i,color:new ye(pt[gn[a].bark]),map:null}],T=wt&&Ar.has(s),p=Xt(a,c),m=T?Tp({kind:s,shape:c,matrix:i,seed:fa([s,c,176])},a,{color:_[0].color,key:"bark"},{color:Go(d,p),key:Jr(p)},!1).near:[];return _.push(...m.filter(v=>v.role==="trunk").map(v=>({role:"trunk",geometry:v.geometry,matrix:v.matrix,color:v.color,map:null}))),l.cards?(a!=="birch"&&_.push({role:"crown",geometry:T&&l.core||l.crown,matrix:i,color:d.clone().multiplyScalar(ql(a)).multiply(o),map:null}),_.push({role:"cards",geometry:T&&l.cardsHeart||l.cards,matrix:i,color:Go(d,p),map:Nl(p)}),_.push(...m.filter(v=>v.role==="cards").map(v=>({role:"cards",geometry:v.geometry,matrix:v.matrix,color:v.color,map:Nl(p)}))),l.strands&&_.push({role:"strands",geometry:l.strands,matrix:i,color:d.clone().lerp(new ye(1,1,.9),.4),map:sp("willow")}),l.blossom&&s!==ht.hawthorn&&_.push({role:"blossom",geometry:l.blossom,matrix:i,color:h,map:cp()})):l.crown&&_.push({role:"crown",geometry:l.crown,matrix:i,color:d.clone().multiply(o),map:null}),_}))}function KE(e,n,t,r,o){let i=new Map,a=l=>{let c=gn[l].bark;return i.has(c)||i.set(c,Bp(new En({color:pt[c],vertexColors:!0}))),i.get(c)},s={crown:r.leafMat,...r.cardMats};for(let l=0;l<dt.length;l++){let c=dt[l];for(let f=0;f<t[l].length;f++)for(let u of[!0,!1]){let d=n.filter(T=>T.kind===l&&T.shape===f&&T.flowers!==!1===u);if(!d.length)continue;let h=t[l][f],_=d.map(T=>Lp(T,h,c));_[0].forEach(([T,p,,,m],v)=>{let x=new ms(p,T==="trunk"?a(c):s[m],d.length);x.userData.role=T,x.userData.kind=c,_.forEach((g,E)=>{let[,,b,w]=g[v];x.setMatrixAt(E,b),T!=="trunk"&&x.setColorAt(E,w)}),T==="trunk"&&(x.userData.trunk=!0),T==="blossom"&&(x.userData.blossom=!0),x.castShadow=o&&T!=="blossom",e.add(x)})}}}var cc=new Set;function g3(e){oc.delete(e);let n=e.userData?.detail;n&&cc.delete(n)}var Xl=class{constructor(n,t,r,o=null,i=null){this.group=n,this.front=o,this.own=i,this.placed=t,this.trees=r,this.centres=new Float32Array(t.length*2),t.forEach((a,s)=>{this.centres[s*2]=a.crown.x,this.centres[s*2+1]=a.crown.z}),this.far=new Uint8Array(t.length),this.close=new Uint8Array(t.length),this.hasClose=r.some(a=>a.close),this.buried=Uint8Array.from(t,a=>a.buried?1:0),this.boughs=new Uint8Array(t.length),this.hasBuried=this.buried.some(a=>a),this.plan=null,this.decided=!1,cc.add(this)}decide(n,t,r=!0,o=n,i=null){let a=this.own&&BE()?this.own:null,s=new Set(ad(this.centres,Ys(n,t),this.far,{distance:Cp()?1/0:eo,never:a}));if(this.hasClose&&r)for(let c of nd(this.centres,o,this.close,{distance:ic(),front:this.front,frontDistance:FE(),max:HE(),always:a,ahead:i?{dir:i}:null}))s.add(c);if(this.hasBuried&&r)for(let c of od(this.centres,Ys(n,t),this.buried,this.boughs))s.add(c);let l=new Set;for(let c of s){let f=this.trees[c],u={far:this.far[c]===1,close:!!f.close&&this.close[c]===1,boughs:this.boughs[c]===1};for(let d of lc(f))d.mesh.setVisibleAt(d.id,Ks(d.role,u,d)),l.add(d.mesh)}for(let c of l)c.userData.shadowVersion=(c.userData.shadowVersion??0)+1;return this.decided=!0,s.size}};function _3(e,n,{cut:t=!1,plan:r=null,stand:o=null}={}){Bd(n);let i=0,a=[n.position.x,n.position.z],s=n.quaternion,l=s?[-2*(s.x*s.z+s.w*s.y),-(1-2*(s.x*s.x+s.y*s.y))]:null,c=l&&Math.hypot(l[0],l[1])>.5?l:null;for(let f of cc){let u=f.group;for(;u.parent;)u=u.parent;if(!u.isScene||u!==e)continue;let d=r!==f.plan;f.plan=r;let h=sd(f.centres,f.far,a[0],a[1],{distance:eo});ld({cut:t||!f.decided,newPlan:d,tooClose:h})&&(i+=f.decide(a,r,t||!f.decided||d,o??a,c))}return i}var oa={factor:1.5,maxPixels:3840*2160,least:1.1},fc={full:4,light:2,superAt:1.4};function M3({supersample:e=1,taa:n=!1}={}){return n&&e>=fc.superAt?fc.light:fc.full}function YE({width:e,height:n,ratio:t=1}={}){let r=Number(e),o=Number(n),i=Number.isFinite(t)&&t>0?t:1;if(!(r>0&&o>0))return 1;let a=r*o*i*i,s=Math.sqrt(oa.maxPixels/a),l=Math.min(oa.factor,s);return l>=oa.least?Math.floor(l*100)/100:1}function T3({width:e,height:n,ratio:t=1,rec:r=null}={}){let o=YE({width:e,height:n,ratio:t}),i=Number.isFinite(t)&&t>0?t:1,a=Number(e)*i,s=Number(n)*i;if(!(r?.width>0&&r?.height>0)||!(a>0&&s>0))return 1;let l=Math.min(r.width/a,r.height/s),c=Math.min(o,l);return c>=oa.least?Math.floor(c*100)/100:1}var qE={factor:1,hold:.3};function b3(e,{moving:n=!1,recording:t=!1,dt:r=0}={}){return t?(e.eased=!1,e.left=0):n?(e.eased=!0,e.left=qE.hold):e.eased&&(e.left-=Number.isFinite(r)?r:0,e.left<=0&&(e.eased=!1)),e.eased}function w3(e,n=1,t=1){let r=Number.isFinite(e)&&e>0?e:1,o=Number.isFinite(n)&&n>0?Math.min(n,1):1,i=Number.isFinite(t)&&t>=1?t:1;return Math.round(r*o*i*1e3)/1e3}var uc={most:2,join:.3,scale:.5,keep:{move:3,turn:.06}};function A3(e,n,t=uc.keep){return e<t.move&&n<t.turn}function R3(e,{most:n=uc.most,join:t=uc.join}={}){let r=[],o=e.map((i,a)=>({...i,i:a})).filter(i=>Number.isFinite(i.level)).sort((i,a)=>(i.near??1/0)-(a.near??1/0));for(let i of o){let a=r.find(s=>Math.abs(s.level-i.level)<=t);a?a.members.push(i.i):r.length<n&&r.push({level:i.level,members:[i.i]})}return r}var Vo={near:.45,nearSoft:.3,far:6,reach:160,farSoft:2,amount:.55};function y3(e){if(!(e>0))return null;let n=Math.max(e*Vo.far,Vo.reach);return{near:[e*Vo.near,e*Vo.nearSoft],far:[n,n*Vo.farSoft]}}var ZE={strength:.08,decay:.95,samples:40,reach:.35,fade:.6,floor:1.2,cap:6};function C3({x:e,y:n,ahead:t}){if(!t||!Number.isFinite(e)||!Number.isFinite(n))return 0;let r=Math.max(Math.abs(e),Math.abs(n))-1;if(r<=0)return 1;let o=Math.min(1,r/ZE.fade);return 1-o*o*(3-2*o)}var jE={frames:8,blend:.9};function Gp(e,n){let t=1,r=0;for(let o=e+1;o>0;o=Math.floor(o/n))t/=n,r+=t*(o%n);return r}function P3(e,{still:n=!1,upscale:t=!1}={}){if(n&&!t)return[0,0];let r=t?kp.frames:jE.frames,o=(e%r+r)%r;return[Gp(o,2)-.5,Gp(o,3)-.5]}var kp={share:.67,frames:16,sharp:2.2,least:.04,most:.3};function L3(e,n,t=!0){let r=t?kp.share:1;return[Math.max(1,Math.round(e*r)),Math.max(1,Math.round(n*r))]}var Sr={most:4,life:5,speed:.8,rings:3,gap:.55};function D3(e,n){let t=e.filter(o=>n.time-o.time<Sr.life),r=Math.min(1,Math.max(0,Number(n.size)||0));return[...t,{...n,size:r}].slice(-Sr.most)}function U3(e){let n=Number.isFinite(e)?e:0;return Math.min(1,.3+n/40)}var ia=6200,Wo=[0,-300],QE=.25,Vp=40,H3={high:{clouds:24,puffs:8},standard:{clouds:12,puffs:5}},zo={billow:.24,soft:.5,shrink:.3,round:.55},dc=new Set;function JE(e,n,t=1){let r=au(t*104729+3),o=[],i=[];for(let a=0;a<e;a++){let l=r()<.6?-Math.PI/2+(r()-.5)*2.2:a/e*Math.PI*2+r()*.3,c=2400+r()*2900,f=a%3===2,u=f?1150+r()*350:560+r()*320,d=f?260+r()*260:380+r()*420;o.push({x:Math.cos(l)*c+Wo[0],y:u,z:Math.sin(l)*c+Wo[1],rank:(a+r()*.8)/e,width:d});for(let h=0;h<n;h++){let _=n===1?0:(h/(n-1)-.5)*2*(.75+r()*.2),T=1-_*_,p=h%2===0,m=d*(.17+.13*T+r()*.06)*(p?.95:.8),v=p?m*.35:m*(.55+T*.7)*(f?.6:1);i.push({cloud:a,x:_*d*.5,y:v,z:(r()-.5)*d*.35,r:m,shade:Math.min(1,v/(d*.42))})}}return{clouds:o,puffs:i}}var zp=e=>Math.min(1,1.7*Math.max(0,Number.isFinite(e)?e:0)),eM=`
  attribute vec3 aCloud;
  attribute vec4 aPuff;
  attribute vec2 aLook;
  uniform vec2 uDrift;
  uniform vec2 uMiddle;
  uniform float uWrap;
  uniform float uShowing;
  uniform float uSize;
  uniform float uReach;
  uniform vec3 uSun;
  varying vec2 vUv;
  varying float vShade;
  varying float vAlpha;
  varying vec2 vSun;
  varying vec2 vSeed;

  void main() {
    // (Each puff's billows its own: from where it sits in its cloud.)
    vSeed = aPuff.xz * 0.031 + aCloud.xz * 0.0007;
    // The cloud's place, drifted and wrapped round the middle of the scene.
    vec2 c = aCloud.xz + uDrift - uMiddle;
    c = mod(c + uWrap, 2.0 * uWrap) - uWrap + uMiddle;
    vec3 centre = vec3(c.x, aCloud.y, c.y);
    vec3 p = centre + aPuff.xyz * uSize;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    mv.xy += position.xy * aPuff.w * 2.0 * uSize;
    gl_Position = projectionMatrix * mv;
    vUv = position.xy;
    // Lit: tops brighter than bases, and the side towards the sun.
    vShade = aLook.x + 0.25 * dot(normalize(aPuff.xyz + vec3(0.0, 1.0, 0.0)), uSun);
    vec3 sunView = (viewMatrix * vec4(uSun, 0.0)).xyz;
    vSun = normalize(sunView.xy + 1e-4);
    // Faded out far away (before the wrap), and in or out with the cover.
    float d = length(centre.xz - cameraPosition.xz);
    float far = 1.0 - smoothstep(0.72 * uWrap * uReach, 0.95 * uWrap * uReach, d);
    float shown = clamp((uShowing - aLook.y) * 10.0, 0.0, 1.0);
    vAlpha = far * shown;
  }
`,tM=`
  uniform vec3 uTop;
  uniform vec3 uBase;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vShade;
  varying float vAlpha;
  varying vec2 vSun;
  varying vec2 vSeed;

  // (The ground's noise: look/glsl/ground.js gHash, gNoise.)
  float cHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float cNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(cHash(i), cHash(i + vec2(1.0, 0.0)), u.x), mix(cHash(i + vec2(0.0, 1.0)), cHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    vec2 q = vUv * 2.0;
    float r = length(q);
    if (r > 1.0 || vAlpha <= 0.0) discard;
    // Its edge broken into small billows (CLOUD_LOOK.billow), not a drawn
    // circle: on a phone's picture each puff read as a hard white ball.
    float edge = ${(1-zo.billow).toFixed(2)} + ${zo.billow.toFixed(2)} * (0.65 * cNoise(q * 2.6 + vSeed * 40.0) + 0.35 * cNoise(q * 6.1 + vSeed * 73.0));
    float body = 1.0 - r / edge;
    // Thinning out to its edge over CLOUD_LOOK.soft of the way in; and as
    // it fades (out far off, or in and out with the day's cover) thinner as
    // a whole and shrunk a little from its edge (CLOUD_LOOK.shrink). With
    // hard-rimmed puffs a cloud half faded was a ghost of rings, each puff's
    // outline over the next; shrunk away alone, it broke into separate
    // little balls.
    float gone = (1.0 - vAlpha) * ${zo.shrink.toFixed(2)};
    float a = smoothstep(gone, gone + ${zo.soft.toFixed(2)}, body) * vAlpha * uOpacity;
    if (a <= 0.003) discard;
    // Lit on the side towards the sun and on top, over the cloud's own
    // shading from base to top - each puff's own roundness held back
    // (CLOUD_LOOK.round), so a cloud is lit as one, not as a heap of balls.
    vec3 n = vec3(q, sqrt(max(0.0, 1.0 - r * r)));
    float towards = dot(n, normalize(vec3(vSun * 0.7, 0.6))) * 0.5 + 0.5;
    float lit = clamp(vShade * 0.55 + (n.y * 0.25 + towards * 0.45 - 0.35) * ${zo.round.toFixed(2)} + 0.3, 0.0, 1.0);
    gl_FragColor = vec4(mix(uBase, uTop, lit), a);
    #include <colorspace_fragment>
  }
`;function B3({clouds:e=24,puffs:n=8,sun:t=new te(0,1,0),seed:r=1}={}){let o=new Ct(1,1),i=new Ts;i.index=o.index,i.setAttribute("position",o.getAttribute("position"));let a=e*n,s=new Ir(new Float32Array(a*3),3),l=new Ir(new Float32Array(a*4),4),c=new Ir(new Float32Array(a*2),2);for(let d of[s,l,c])d.setUsage(cs);i.setAttribute("aCloud",s),i.setAttribute("aPuff",l),i.setAttribute("aLook",c),i.instanceCount=a;let f=new tn({name:"Clouds",vertexShader:eM,fragmentShader:tM,uniforms:{uDrift:{value:new je},uMiddle:{value:new je(...Wo)},uWrap:{value:ia},uShowing:{value:zp(.35)},uSize:{value:1},uReach:{value:1},uSun:{value:t.clone().normalize()},uTop:{value:new ye(pt.cloud)},uBase:{value:new ye(pt.cloudShade)},uOpacity:{value:.95}},transparent:!0,depthWrite:!1,fog:!1,toneMapped:!1});on(f,"clouds",{uniforms:f.uniforms});let u=new yt(i,f);return u.name="clouds",u.frustumCulled=!1,u.userData.clouds={count:e,perCloud:n,sortedAt:-1/0,at:new te(1/0,0,0),sorts:0},nM(u,r),u.onBeforeRender=(d,h,_)=>rM(u,_),dc.add(u),u}function nM(e,n=1){let t=e.userData.clouds;t.layout=JE(t.count,t.perCloud,n),t.seed=n,t.sortedAt=-1/0}function G3(e,n){let t=e.material.uniforms;t.uShowing.value=zp(n.cover),t.uSize.value=1+.55*Math.max(0,n.cover-.35),t.uOpacity.value=.9+.08*n.cover,t.uBase.value.set(pt.cloudShade).lerp(new ye(pt.cloudSlate),n.grey*.8)}function rM(e,n){let t=e.userData.clouds,r=performance.now()/1e3,o=n.getWorldPosition(oM);if(r-t.sortedAt<QE&&o.distanceToSquared(t.at)<Vp*Vp)return;t.sortedAt=r,t.at.copy(o),t.sorts++;let i=e.material.uniforms,a=i.uSize.value,[s,l]=[i.uDrift.value.x,i.uDrift.value.y],c=ia,f=(x,g)=>((x-g+c)%(2*c)+2*c)%(2*c)-c+g,{clouds:u,puffs:d}=t.layout,h=u.map(x=>[f(x.x+s,Wo[0]),x.y,f(x.z+l,Wo[1])]),_=d.map((x,g)=>{let E=h[x.cloud],b=E[0]+x.x*a-o.x,w=E[1]+x.y*a-o.y,S=E[2]+x.z*a-o.z;return[b*b+w*w+S*S,g]});_.sort((x,g)=>g[0]-x[0]);let T=e.geometry,p=T.getAttribute("aCloud").array,m=T.getAttribute("aPuff").array,v=T.getAttribute("aLook").array;_.forEach(([,x],g)=>{let E=d[x],b=u[E.cloud];p.set([b.x,b.y,b.z],g*3),m.set([E.x,E.y,E.z,E.r],g*4),v.set([E.shade,b.rank],g*2)});for(let x of["aCloud","aPuff","aLook"])T.getAttribute(x).needsUpdate=!0}var oM=new te,k3=e=>1/(1+.6*Math.max(0,e-1));function V3(e,[n,t]){for(let r of dc){if(!r.parent){dc.delete(r);continue}let o=r.material.uniforms.uDrift.value;o.x=(o.x+n*e)%(2*ia),o.y=(o.y+t*e)%(2*ia)}}var Wp={base:700,top:1350,steps:32,light:3,reach:9e3,fade:.45,noise:32,cells:4,big:700,small:190};function W3(e){let n=Math.min(1,Math.max(0,Number.isFinite(e)?e:.35));return n<.35?.97-(.97-.625)*(n/.35):Math.max(.25,.8-.5*n)}function X3(e=Wp.noise,n=Wp.cells,t=7){let r=t,o=()=>(r=r*16807%2147483647)/2147483647,i=u=>{let d=Float32Array.from({length:u*u*u},o);return(_,T,p)=>d[(p%u+u)%u*u*u+(T%u+u)%u*u+(_%u+u)%u]},a=i(n),s=i(n*2),l=u=>u*u*(3-2*u),c=(u,d,h,_,T)=>{let p=h/e*d,m=_/e*d,v=T/e*d,x=Math.floor(p),g=Math.floor(m),E=Math.floor(v),b=l(p-x),w=l(m-g),S=l(v-E),A=(P,D,U)=>P+(D-P)*U,C=P=>A(A(u(x,g,P),u(x+1,g,P),b),A(u(x,g+1,P),u(x+1,g+1,P),b),w);return A(C(E),C(E+1),S)},f=new Uint8Array(e*e*e);for(let u=0;u<e;u++)for(let d=0;d<e;d++)for(let h=0;h<e;h++){let _=.65*c(a,n,h,d,u)+.35*c(s,n*2,h,d,u);f[u*e*e+d*e+h]=Math.round(_*255)}return f}function Xp(e,n,t){let r=!1;for(let o=0,i=e.length-1;o<e.length;i=o++){let[a,s]=e[o],[l,c]=e[i];s>t!=c>t&&n<(l-a)*(t-s)/(c-s)+a&&(r=!r)}return r}var Kp=2e3;function*K3(e,{cell:n=.25,pad:t=1.5,maxCells:r=160,heightAt:o=null}={},i=Kp){let a=1/0,s=1/0,l=-1/0,c=-1/0;for(let[x,g]of e)a=Math.min(a,x),s=Math.min(s,g),l=Math.max(l,x),c=Math.max(c,g);a-=t,s-=t,l+=t,c+=t,n=Math.max(n,(l-a)/(r-1),(c-s)/(r-1));let f=Math.ceil((l-a)/n)+1,u=Math.ceil((c-s)/n)+1,d=new Float32Array(f*u),h=o?new Float32Array(f*u):null,_=e.length,T=Float64Array.from(e,x=>x[0]),p=Float64Array.from(e,x=>x[1]),m=o?Float64Array.from(e,x=>o(x[0],x[1])):null,v=0;for(let x=0;x<u;x++){x&&(v+=f)>=i&&(v=0,yield);let g=s+x*n;for(let E=0;E<f;E++){let b=a+E*n,w=1/0,S=!1,A=0,C=0;for(let D=0,U=_-1;D<_;U=D++){let L=T[U],F=p[U],G=T[D]-L,H=p[D]-F,X=G*G+H*H,$=X>0?((b-L)*G+(g-F)*H)/X:0;$=$<0?0:$>1?1:$;let j=L+G*$-b,Z=F+H*$-g,ge=j*j+Z*Z;if(ge<w&&(w=ge),m){let _e=Math.sqrt(X)/((ge+.25)*(ge+.25));A+=_e*(m[U]+(m[D]-m[U])*$),C+=_e}p[D]>g!=F>g&&b<G*(g-p[D])/H+T[D]&&(S=!S)}w=Math.sqrt(w);let P=x*f+E;d[P]=S?w:-w,h&&(h[P]=S&&C>0?Math.max(0,A/C-o(b,g)):0)}}return{x0:a,z0:s,cell:n,nx:f,nz:u,width:(f-1)*n,height:(u-1)*n,dist:d,depth:h}}function iM(e,n,t=4){let{x0:r,z0:o,cell:i,nx:a,nz:s}=e,l=r+(a-1)*i,c=o+(s-1)*i,f=n.filter(d=>{let h=d.map(T=>T[0]),_=d.map(T=>T[1]);return Math.min(...h)<l+t&&Math.max(...h)>r-t&&Math.min(..._)<c+t&&Math.max(..._)>o-t});if(!f.length)return null;let u=new Float32Array(a*s).fill(1/0);for(let d of f){let h=d.length;for(let _=0;_<s;_++){let T=o+_*i;for(let p=0;p<a;p++){let m=r+p*i,v=1/0,x=!1;for(let b=0,w=h-1;b<h;w=b++){let[S,A]=d[w],C=d[b][0]-S,P=d[b][1]-A,D=C*C+P*P,U=D>0?((m-S)*C+(T-A)*P)/D:0;U=U<0?0:U>1?1:U;let L=S+C*U-m,F=A+P*U-T;v=Math.min(v,L*L+F*F),d[b][1]>T!=A>T&&m<C*(T-d[b][1])/P+d[b][0]&&(x=!x)}let g=x?-Math.sqrt(v):Math.sqrt(v),E=_*a+p;g<u[E]&&(u[E]=g)}}}return u}function*Y3(e,{cell:n=.25,pad:t=1.5,maxCells:r=160,heightAt:o=null}={},i=Kp){let a=1/0,s=1/0,l=-1/0,c=-1/0;for(let p of e)for(let[m,v]of p)a=Math.min(a,m),s=Math.min(s,v),l=Math.max(l,m),c=Math.max(c,v);a-=t,s-=t,l+=t,c+=t,n=Math.max(n,(l-a)/(r-1),(c-s)/(r-1));let f=Math.ceil((l-a)/n)+1,u=Math.ceil((c-s)/n)+1,d=[];e.forEach((p,m)=>{for(let v=0,x=p.length-1;v<p.length;x=v++){let g=(p[v][0]+p[x][0])/2,E=(p[v][1]+p[x][1])/2;e.some((b,w)=>w!==m&&Xp(b,g,E))||d.push([p[x][0],p[x][1],p[v][0],p[v][1],o?o(p[x][0],p[x][1]):0,o?o(p[v][0],p[v][1]):0])}});let h=new Float32Array(f*u),_=o?new Float32Array(f*u):null,T=0;for(let p=0;p<u;p++){p&&(T+=f)>=i&&(T=0,yield);let m=s+p*n;for(let v=0;v<f;v++){let x=a+v*n,g=1/0,E=0,b=0;for(let[A,C,P,D,U,L]of d){let F=P-A,G=D-C,H=F*F+G*G,X=H>0?((x-A)*F+(m-C)*G)/H:0;X=X<0?0:X>1?1:X;let $=A+F*X-x,j=C+G*X-m,Z=$*$+j*j;if(Z<g&&(g=Z),_){let ge=Math.sqrt(H)/((Z+.25)*(Z+.25));E+=ge*(U+(L-U)*X),b+=ge}}let w=e.some(A=>Xp(A,x,m));g=Math.sqrt(g);let S=p*f+v;h[S]=w?g:-g,_&&(_[S]=w&&b>0?Math.max(0,E/b-o(x,m)):0)}}return{x0:a,z0:s,cell:n,nx:f,nz:u,width:(f-1)*n,height:(u-1)*n,dist:h,depth:_}}function q3(e,n){let t=n?.length?iM(e,n,0):null;if(!t)return e;let{dist:r}=e;for(let o=0;o<r.length;o++)t[o]<0&&-t[o]>r[o]&&(r[o]=-t[o]);return e}function Z3(e,n){let{x0:t,z0:r,cell:o,nx:i,nz:a}=e,s=new Float32Array(i*a);for(let l=0;l<a;l++){let c=r+l*o;for(let f=0;f<i;f++){let u=t+f*o,d=1/0;for(let h=1;h<n.length;h++){let[_,T]=n[h-1],p=n[h][0]-_,m=n[h][1]-T,v=p*p+m*m,x=v>0?((u-_)*p+(c-T)*m)/v:0;x=x<0?0:x>1?1:x;let g=_+p*x-u,E=T+m*x-c;d=Math.min(d,g*g+E*E)}s[l*i+f]=Math.sqrt(d)}}return s}function j3(e,n){let{x0:t,z0:r,cell:o,nx:i,nz:a,dist:s}=e,l=new Float32Array(i*a),c=!1;for(let f=0;f<a;f++)for(let u=0;u<i;u++){let d=f*i+u;l[d]=n(t+u*o,r+f*o),l[d]<0&&s[d]>0&&(c=!0)}if(!c)return null;for(let f=0;f<s.length;f++)s[f]=Math.min(s[f],l[f]);return l}var hc=[-2,4],aM=4,$p=4;function Q3(e,n=[-2,6],t=2,r=null,o=null,i=null){let{dist:a,depth:s}=e,l=new Uint8Array(a.length*4),c=n[1]-n[0],f=hc[1]-hc[0];for(let u=0;u<a.length;u++)l[u*4]=Math.round(255*Math.max(0,Math.min(1,(a[u]-n[0])/c))),i?l[u*4+1]=Math.round(255*Math.max(0,Math.min(1,(i[u]+$p)/(2*$p)))):l[u*4+1]=s?Math.round(255*Math.max(0,Math.min(1,s[u]/t))):0,l[u*4+2]=r?Math.round(255*Math.max(0,Math.min(1,(r[u]-hc[0])/f))):255,l[u*4+3]=o?Math.round(255*Math.max(0,Math.min(1,o[u]/aM))):255;return l}var sM=256;function lM(e=sM){let n=new Uint8ClampedArray(e*e*4),t=Pc(17),r=[];for(;r.length<18;){let i=Math.round((t()-.5)*36),a=Math.round((t()-.5)*36),s=Math.hypot(i,a);s<3||r.push({kx:i,ky:a,phase:t()*6.28,amp:(4+t()*4)/s})}let o=(i,a)=>r.reduce((s,l)=>s+l.amp*Math.sin((l.kx*i+l.ky*a)/e*6.2832+l.phase),0);for(let i=0;i<e;i++)for(let a=0;a<e;a++){let s=o(a+1,i)-o(a-1,i),l=o(a,i+1)-o(a,i-1),c=Math.hypot(s*.4,l*.4,1),f=(i*e+a)*4;n[f]=-s*.4/c*127+128,n[f+1]=-l*.4/c*127+128,n[f+2]=1/c*127+128,n[f+3]=255}return n}var to=null;function Yp(){if(to!=null)return to;let e=lM();to=0;for(let n=0;n<e.length;n+=4)to=Math.max(to,Math.hypot(e[n]/255*2-1,e[n+1]/255*2-1));return to}function cM(e,n,t){let r=n.y-t;if(!(r>0))return null;let o=1/0,i=1/0,a=-1/0,s=-1/0;for(let l=0;l<8;l++){let c=l&1?e.max.x:e.min.x,f=l&2?e.max.y:e.min.y,u=l&4?e.max.z:e.min.z,d=r/(r+Math.max(0,f-t)),h=n.x+(c-n.x)*d,_=n.z+(u-n.z)*d;h<o&&(o=h),h>a&&(a=h),_<i&&(i=_),_>s&&(s=_)}return{x0:o,z0:i,x1:a,z1:s}}var fM=(e,n)=>e.x0<=n.x1&&n.x0<=e.x1&&e.z0<=n.z1&&n.z0<=e.z1;function oy(e,n,t,r){if(!e||!Number.isFinite(e.min?.x)||!Number.isFinite(e.max?.x))return!0;let o=cM(e,n,t);return!!o&&r.some(i=>fM(o,i))}function iy(e,n,t,r){let o=n.y-t;if(!(o>0))return null;let i=(o+Math.max(0,r-t))/o,a=e.x0,s=e.z0,l=e.x1,c=e.z1;for(let f of[e.x0,e.x1])for(let u of[e.z0,e.z1]){let d=n.x+(f-n.x)*i,h=n.z+(u-n.z)*i;a=Math.min(a,d),l=Math.max(l,d),s=Math.min(s,h),c=Math.max(c,h)}return{x0:a,z0:s,x1:l,z1:c}}var uM=64;function ay(e,n,t=uM){let r=Math.floor((e?e.length:n.length/3)/3),o=e?l=>e[l]:l=>l,i=Math.ceil(r/t),a=new Float32Array(i).fill(-1/0),s=new Float32Array(i).fill(1/0);for(let l=0;l<r;l++){let c=Math.floor(l/t);for(let f=0;f<3;f++){let u=n[o(l*3+f)*3+2];u>a[c]&&(a[c]=u),u<s[c]&&(s[c]=u)}}for(let l=1;l<i;l++)a[l]=Math.max(a[l],a[l-1]);for(let l=i-2;l>=0;l--)s[l]=Math.min(s[l],s[l+1]);return{count:r,block:t,top:a,bottom:s}}function sy(e,n,t){let{count:r,block:o,top:i,bottom:a}=e,s=i.length,l=0,c=s;for(;l<c;){let u=l+c>>1;i[u]<n?l=u+1:c=u}let f=l;for(l=0,c=s;l<c;){let u=l+c>>1;a[u]<=t?l=u+1:c=u}return[f*o,Math.min(r,l*o)]}var xr={coarse:.11,fine:.06,gust:1.3,rain:.5,splash:.55,ringFade:.25,mirror:.06},ly=Object.freeze({near:3,reach:40,calm:.9,wind:6}),cy=Object.freeze({tint:.35,clear:.15,poolFrom:.55,poolTo:.8,scale:2,stretch:.5,speed:.35}),dM=1/Math.sqrt(2*Math.E);function fy({chop:e=1,gust:n=0,rain:t=0,splashes:r=[],now:o=0}={},i=Yp()){let a=(xr.coarse+xr.fine)*i*Math.max(0,e)*(1+xr.gust*Math.max(0,n));t>0&&(a+=xr.rain);for(let s of r){let l=o-s.time;if(!(s.size>0)||l<0||l>=Sr.life)continue;let c=(1-l/Sr.life)**2*s.size,f=0;for(let u=0;u<Sr.rings&&l-u*Sr.gap>=0;u++)f+=1-u*xr.ringFade;a+=xr.splash*dM*c*f}return xr.mirror*2*Math.sin(Math.atan(a)/2)}export{Pe as a,gi as b,Uu as c,Ge as d,Tl as e,d2 as f,rn as g,Nt as h,F1 as i,Gr as j,H1 as k,B1 as l,$u as m,G1 as n,aS as o,k1 as p,V1 as q,z1 as r,W1 as s,X1 as t,Q1 as u,J1 as v,ft as w,Ce as x,wt as y,At as z,Ot as A,lS as B,eA as C,tA as D,xh as E,uS as F,qs as G,dn as H,MS as I,MA as J,TA as K,bA as L,wA as M,rl as N,AA as O,kr as P,Zs as Q,iA as R,aA as S,Js as T,sA as U,lA as V,cA as W,dd as X,Pn as Y,vS as Z,fA as _,tl as $,ES as aa,Ti as ba,gA as ca,_A as da,Md as ea,RS as fa,ol as ga,LA as ha,DA as ia,Rd as ja,PS as ka,LS as la,DS as ma,Ai as na,OS as oa,FS as pa,BA as qa,zA as ra,fR as sa,on as ta,zn as ua,Ao as va,KA as wa,YA as xa,ZA as ya,qd as za,bR as Aa,wR as Ba,gl as Ca,Zd as Da,Wr as Ea,XS as Fa,nR as Ga,rR as Ha,Qd as Ia,Jd as Ja,YS as Ka,eh as La,th as Ma,oR as Na,iR as Oa,hh as Pa,PR as Qa,ph as Ra,DR as Sa,_h as Ta,Dt as Ua,Ml as Va,ox as Wa,r2 as Xa,o2 as Ya,ix as Za,i2 as _a,a2 as $a,s2 as ab,vh as bb,Pi as cb,l2 as db,c2 as eb,T2 as fb,Ch as gb,b2 as hb,w2 as ib,Lh as jb,A2 as kb,Ne as lb,ep as mb,np as nb,Fx as ob,o3 as pb,Vi as qb,i3 as rb,a3 as sb,s3 as tb,l3 as ub,c3 as vb,f3 as wb,ac as xb,u3 as yb,d3 as zb,h3 as Ab,p3 as Bb,m3 as Cb,g3 as Db,_3 as Eb,M3 as Fb,YE as Gb,T3 as Hb,qE as Ib,b3 as Jb,w3 as Kb,uc as Lb,A3 as Mb,R3 as Nb,Vo as Ob,y3 as Pb,ZE as Qb,C3 as Rb,jE as Sb,P3 as Tb,kp as Ub,L3 as Vb,Sr as Wb,D3 as Xb,U3 as Yb,H3 as Zb,zo as _b,B3 as $b,nM as ac,G3 as bc,k3 as cc,V3 as dc,Zv as ec,jv as fc,Qv as gc,Jv as hc,P1 as ic,L1 as jc,D1 as kc,U1 as lc,I1 as mc,N1 as nc,Vu as oc,Wp as pc,W3 as qc,X3 as rc,Xp as sc,K3 as tc,iM as uc,Y3 as vc,q3 as wc,Z3 as xc,j3 as yc,hc as zc,aM as Ac,$p as Bc,Q3 as Cc,sM as Dc,lM as Ec,oy as Fc,iy as Gc,uM as Hc,ay as Ic,sy as Jc,xr as Kc,ly as Lc,cy as Mc,fy as Nc};
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
