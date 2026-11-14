import{B as mo,c as Gt,d as io,k as pt,l as qf,y as Ts}from"./game.chunk-A6QJI4GQ.js";import{E as bs,b as Zf,c as jf,w as go}from"./game.chunk-NH73Y4FX.js";import{A as nr,C as Es,H as Yf,ca as Ms,da as Kf,va as Qf,y as Xf,z as $f}from"./game.chunk-IGC6FMZ4.js";import{a as oo,b as Ac,c as Rc,e as sa}from"./game.chunk-D65CLSHU.js";import{Aa as uc,Ad as wc,Ba as oa,Ca as An,Da as Mr,Ea as dc,Fa as hc,Ga as Tr,Ha as br,Ia as no,Ja as dt,Ka as ht,Ma as pc,Na as mc,Oa as gc,Ud as $o,ac as _c,fd as Zn,gd as ro,hd as wr,id as Rn,jd as jn,kd as vc,ld as Wo,md as Sc,nd as ia,od as xc,pd as Ec,qd as Mc,sd as aa,td as Xo,ud as Tc,z as to,zd as bc}from"./game.chunk-PLIHCEDK.js";import{$ as ha,$a as ei,$b as _f,A as Fc,Ab as Za,Ac as xf,B as Hc,Ba as Wt,Bb as ja,Bc as oi,Bd as $t,C as Bc,Ca as uf,Cb as Qa,Cc as Ef,Cg as zf,D as Gc,Da as df,Db as Ja,Dc as Mf,Dd as Uf,De as hs,Df as xn,Dg as Wf,E as kc,Ea as fo,Eb as es,Ec as ii,Ee as uo,Ef as kf,F as Vc,Fa as xa,Fb as ri,Fc as Tf,Fd as cs,Ff as Vf,G as zc,Ga as Hn,Gb as ts,Gd as ai,Ge as ho,H as Wc,Ha as yn,Hc as is,Hd as ye,He as Hf,I as Xc,Ia as Sn,Ie as ps,J as $c,Ja as Ea,Jd as fs,Je as li,K as Yc,Ka as Ma,L as Kc,La as Pr,M as qc,Ma as hf,N as Zc,Na as pf,O as jc,Oa as mf,Od as Ge,P as Qc,Pa as gf,Q as Jc,Qa as Zt,Qc as as,R as ef,Ra as Jn,Rc as ss,S as da,Sa as er,T as tf,Ta as jo,Td as If,U as nf,Ua as Ta,V as rf,Va as tr,Vd as Nf,W as of,Wa as ba,X as af,Xd as Yt,Y as sf,Ya as wa,Z as lf,Za as Qo,Zc as bf,Zd as xt,_ as ln,_a as Jo,_b as ns,_c as wf,a as yc,aa as pa,ab as ti,ac as fn,ae as Of,ba as ma,bb as Aa,bc as Lr,bd as ls,ca as ga,cb as Ra,cc as rs,cd as qe,d as Cc,da as _a,db as ya,dc as os,dd as it,e as la,ea as va,eb as Ca,ec as tt,ed as Af,f as Pc,fa as Sa,fb as Pa,ff as ci,fg as _s,gb as La,gd as Rf,ge as Ff,gf as ms,hb as Da,hd as yf,he as Rt,i as ao,ib as Ua,id as Cf,if as Ct,j as Lc,ja as Cr,jb as Ia,jd as Pf,k as Ar,ka as Qn,kb as ni,ke as Bn,kg as po,l as Rr,la as Yo,lb as Na,ld as je,m as kt,ma as Ko,mb as Oa,md as Xt,me as Ur,n as qt,na as lo,nb as Fa,nd as ne,ne as us,ng as vs,nh as xs,o as vn,oa as cn,ob as Ha,od as He,oe as ds,p as so,pa as qo,pb as Ba,pd as ct,q as ca,qa as cf,qb as Ga,qe as si,r as fa,ra as Fn,rb as ka,s as ua,sa as ff,sb as Va,sf as fi,t as Dc,tb as za,td as Lf,tf as Ht,ua as co,ub as Wa,ud as Ft,uf as gs,v as yr,vb as Xa,vf as Bf,vg as Ss,w as Uc,wa as St,wb as $a,wd as jt,wf as Qt,x as Ic,xa as Zo,xb as Ya,xd as Dr,xf as Gf,y as Nc,yb as Ka,yc as vf,z as Oc,za as zt,zb as qa,zc as Sf,zd as Df}from"./game.chunk-X5TZQDMQ.js";function Eu(){let e=null,n=!1,t=null,r=null;function o(i,a){r=e.requestAnimationFrame(o),t(i,a)}return{start:function(){n!==!0&&t!==null&&e!==null&&(r=e.requestAnimationFrame(o),n=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),n=!1},setAnimationLoop:function(i){t=i},setContext:function(i){e=i}}}function Lp(e){let n=new WeakMap;function t(s,l){let c=s.array,f=s.usage,u=c.byteLength,d=e.createBuffer();e.bindBuffer(l,d),e.bufferData(l,c,f),s.onUploadCallback();let h;if(c instanceof Float32Array)h=e.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)h=e.HALF_FLOAT;else if(c instanceof Uint16Array)s.isFloat16BufferAttribute?h=e.HALF_FLOAT:h=e.UNSIGNED_SHORT;else if(c instanceof Int16Array)h=e.SHORT;else if(c instanceof Uint32Array)h=e.UNSIGNED_INT;else if(c instanceof Int32Array)h=e.INT;else if(c instanceof Int8Array)h=e.BYTE;else if(c instanceof Uint8Array)h=e.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)h=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:h,bytesPerElement:c.BYTES_PER_ELEMENT,version:s.version,size:u}}function r(s,l,c){let f=l.array,u=l.updateRanges;if(e.bindBuffer(c,s),u.length===0)e.bufferSubData(c,0,f);else{u.sort((h,_)=>h.start-_.start);let d=0;for(let h=1;h<u.length;h++){let _=u[d],T=u[h];T.start<=_.start+_.count+1?_.count=Math.max(_.count,T.start+T.count-_.start):(++d,u[d]=T)}u.length=d+1;for(let h=0,_=u.length;h<_;h++){let T=u[h];e.bufferSubData(c,T.start*f.BYTES_PER_ELEMENT,f,T.start,T.count)}l.clearUpdateRanges()}l.onUploadCallback()}function o(s){return s.isInterleavedBufferAttribute&&(s=s.data),n.get(s)}function i(s){s.isInterleavedBufferAttribute&&(s=s.data);let l=n.get(s);l&&(e.deleteBuffer(l.buffer),n.delete(s))}function a(s,l){if(s.isInterleavedBufferAttribute&&(s=s.data),s.isGLBufferAttribute){let f=n.get(s);(!f||f.version<s.version)&&n.set(s,{buffer:s.buffer,type:s.type,bytesPerElement:s.elementSize,version:s.version});return}let c=n.get(s);if(c===void 0)n.set(s,t(s,l));else if(c.version<s.version){if(c.size!==s.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");r(c.buffer,s,l),c.version=s.version}}return{get:o,remove:i,update:a}}var Dp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Up=`#ifdef USE_ALPHAHASH
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
#endif`,Ip=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Np=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Op=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Fp=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Hp=`#ifdef USE_AOMAP
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
#endif`,Bp=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Gp=`#ifdef USE_BATCHING
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
#endif`,kp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Vp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,zp=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Wp=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Xp=`#ifdef USE_IRIDESCENCE
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
#endif`,$p=`#ifdef USE_BUMPMAP
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
#endif`,Yp=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Kp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,qp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Zp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,jp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Qp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Jp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,em=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,tm=`#define PI 3.141592653589793
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
} // validated`,nm=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,rm=`vec3 transformedNormal = objectNormal;
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
#endif`,om=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,im=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,am=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,sm=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,lm="gl_FragColor = linearToOutputTexel( gl_FragColor );",cm=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,fm=`#ifdef USE_ENVMAP
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
#endif`,um=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,dm=`#ifdef USE_ENVMAP
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
#endif`,hm=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,pm=`#ifdef USE_ENVMAP
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
#endif`,mm=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,gm=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,_m=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,vm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Sm=`#ifdef USE_GRADIENTMAP
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
}`,xm=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Em=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Mm=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Tm=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,bm=`#ifdef USE_ENVMAP
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
#endif`,wm=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Am=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Rm=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,ym=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Cm=`PhysicalMaterial material;
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
#endif`,Pm=`uniform sampler2D dfgLUT;
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
}`,Lm=`
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
#endif`,Dm=`#if defined( RE_IndirectDiffuse )
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
#endif`,Um=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Im=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,Nm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Om=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Fm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Hm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Bm=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Gm=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,km=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Vm=`#if defined( USE_POINTS_UV )
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
#endif`,zm=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Wm=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Xm=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,$m=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ym=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Km=`#ifdef USE_MORPHTARGETS
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
#endif`,qm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Zm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,jm=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Qm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Jm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,e0=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,t0=`#ifdef USE_NORMALMAP
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
#endif`,n0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,r0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,o0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,i0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,a0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,s0=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,l0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,c0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,f0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,u0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,d0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,h0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,p0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,m0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,g0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,_0=`float getShadowMask() {
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
}`,v0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,S0=`#ifdef USE_SKINNING
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
#endif`,x0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,E0=`#ifdef USE_SKINNING
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
#endif`,M0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,T0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,b0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,w0=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,A0=`#ifdef USE_TRANSMISSION
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
#endif`,R0=`#ifdef USE_TRANSMISSION
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
#endif`,y0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,C0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,P0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,L0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,D0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,U0=`uniform sampler2D t2D;
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
}`,I0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,N0=`#ifdef ENVMAP_TYPE_CUBE
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
}`,O0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,F0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,H0=`#include <common>
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
}`,B0=`#if DEPTH_PACKING == 3200
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
}`,G0=`#define DISTANCE
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
}`,k0=`#define DISTANCE
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
}`,V0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,z0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,W0=`uniform float scale;
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
}`,X0=`uniform vec3 diffuse;
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
}`,$0=`#include <common>
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
}`,Y0=`uniform vec3 diffuse;
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
}`,K0=`#define LAMBERT
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
}`,q0=`#define LAMBERT
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
}`,Z0=`#define MATCAP
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
}`,j0=`#define MATCAP
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
}`,Q0=`#define NORMAL
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
}`,J0=`#define NORMAL
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
}`,eg=`#define PHONG
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
}`,tg=`#define PHONG
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
}`,ng=`#define STANDARD
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
}`,rg=`#define STANDARD
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
}`,og=`#define TOON
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
}`,ig=`#define TOON
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
}`,ag=`uniform float size;
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
}`,sg=`uniform vec3 diffuse;
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
}`,lg=`#include <common>
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
}`,cg=`uniform vec3 color;
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
}`,fg=`uniform float rotation;
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
}`,ug=`uniform vec3 diffuse;
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
}`,Ce={alphahash_fragment:Dp,alphahash_pars_fragment:Up,alphamap_fragment:Ip,alphamap_pars_fragment:Np,alphatest_fragment:Op,alphatest_pars_fragment:Fp,aomap_fragment:Hp,aomap_pars_fragment:Bp,batching_pars_vertex:Gp,batching_vertex:kp,begin_vertex:Vp,beginnormal_vertex:zp,bsdfs:Wp,iridescence_fragment:Xp,bumpmap_pars_fragment:$p,clipping_planes_fragment:Yp,clipping_planes_pars_fragment:Kp,clipping_planes_pars_vertex:qp,clipping_planes_vertex:Zp,color_fragment:jp,color_pars_fragment:Qp,color_pars_vertex:Jp,color_vertex:em,common:tm,cube_uv_reflection_fragment:nm,defaultnormal_vertex:rm,displacementmap_pars_vertex:om,displacementmap_vertex:im,emissivemap_fragment:am,emissivemap_pars_fragment:sm,colorspace_fragment:lm,colorspace_pars_fragment:cm,envmap_fragment:fm,envmap_common_pars_fragment:um,envmap_pars_fragment:dm,envmap_pars_vertex:hm,envmap_physical_pars_fragment:bm,envmap_vertex:pm,fog_vertex:mm,fog_pars_vertex:gm,fog_fragment:_m,fog_pars_fragment:vm,gradientmap_pars_fragment:Sm,lightmap_pars_fragment:xm,lights_lambert_fragment:Em,lights_lambert_pars_fragment:Mm,lights_pars_begin:Tm,lights_toon_fragment:wm,lights_toon_pars_fragment:Am,lights_phong_fragment:Rm,lights_phong_pars_fragment:ym,lights_physical_fragment:Cm,lights_physical_pars_fragment:Pm,lights_fragment_begin:Lm,lights_fragment_maps:Dm,lights_fragment_end:Um,lightprobes_pars_fragment:Im,logdepthbuf_fragment:Nm,logdepthbuf_pars_fragment:Om,logdepthbuf_pars_vertex:Fm,logdepthbuf_vertex:Hm,map_fragment:Bm,map_pars_fragment:Gm,map_particle_fragment:km,map_particle_pars_fragment:Vm,metalnessmap_fragment:zm,metalnessmap_pars_fragment:Wm,morphinstance_vertex:Xm,morphcolor_vertex:$m,morphnormal_vertex:Ym,morphtarget_pars_vertex:Km,morphtarget_vertex:qm,normal_fragment_begin:Zm,normal_fragment_maps:jm,normal_pars_fragment:Qm,normal_pars_vertex:Jm,normal_vertex:e0,normalmap_pars_fragment:t0,clearcoat_normal_fragment_begin:n0,clearcoat_normal_fragment_maps:r0,clearcoat_pars_fragment:o0,iridescence_pars_fragment:i0,opaque_fragment:a0,packing:s0,premultiplied_alpha_fragment:l0,project_vertex:c0,dithering_fragment:f0,dithering_pars_fragment:u0,roughnessmap_fragment:d0,roughnessmap_pars_fragment:h0,shadowmap_pars_fragment:p0,shadowmap_pars_vertex:m0,shadowmap_vertex:g0,shadowmask_pars_fragment:_0,skinbase_vertex:v0,skinning_pars_vertex:S0,skinning_vertex:x0,skinnormal_vertex:E0,specularmap_fragment:M0,specularmap_pars_fragment:T0,tonemapping_fragment:b0,tonemapping_pars_fragment:w0,transmission_fragment:A0,transmission_pars_fragment:R0,uv_pars_fragment:y0,uv_pars_vertex:C0,uv_vertex:P0,worldpos_vertex:L0,background_vert:D0,background_frag:U0,backgroundCube_vert:I0,backgroundCube_frag:N0,cube_vert:O0,cube_frag:F0,depth_vert:H0,depth_frag:B0,distance_vert:G0,distance_frag:k0,equirect_vert:V0,equirect_frag:z0,linedashed_vert:W0,linedashed_frag:X0,meshbasic_vert:$0,meshbasic_frag:Y0,meshlambert_vert:K0,meshlambert_frag:q0,meshmatcap_vert:Z0,meshmatcap_frag:j0,meshnormal_vert:Q0,meshnormal_frag:J0,meshphong_vert:eg,meshphong_frag:tg,meshphysical_vert:ng,meshphysical_frag:rg,meshtoon_vert:og,meshtoon_frag:ig,points_vert:ag,points_frag:sg,shadow_vert:lg,shadow_frag:cg,sprite_vert:fg,sprite_frag:ug},ce={common:{diffuse:{value:new ye(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new He}},envmap:{envMap:{value:null},envMapRotation:{value:new He},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new He}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new He}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new He},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new He},normalScale:{value:new je(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new He},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new He}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new He}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new He}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ye(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new ne},probesMax:{value:new ne},probesResolution:{value:new ne}},points:{diffuse:{value:new ye(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0},uvTransform:{value:new He}},sprite:{diffuse:{value:new ye(16777215)},opacity:{value:1},center:{value:new je(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}}},Jt={basic:{uniforms:Ht([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.fog]),vertexShader:Ce.meshbasic_vert,fragmentShader:Ce.meshbasic_frag},lambert:{uniforms:Ht([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new ye(0)},envMapIntensity:{value:1}}]),vertexShader:Ce.meshlambert_vert,fragmentShader:Ce.meshlambert_frag},phong:{uniforms:Ht([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new ye(0)},specular:{value:new ye(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ce.meshphong_vert,fragmentShader:Ce.meshphong_frag},standard:{uniforms:Ht([ce.common,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.roughnessmap,ce.metalnessmap,ce.fog,ce.lights,{emissive:{value:new ye(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ce.meshphysical_vert,fragmentShader:Ce.meshphysical_frag},toon:{uniforms:Ht([ce.common,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.gradientmap,ce.fog,ce.lights,{emissive:{value:new ye(0)}}]),vertexShader:Ce.meshtoon_vert,fragmentShader:Ce.meshtoon_frag},matcap:{uniforms:Ht([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,{matcap:{value:null}}]),vertexShader:Ce.meshmatcap_vert,fragmentShader:Ce.meshmatcap_frag},points:{uniforms:Ht([ce.points,ce.fog]),vertexShader:Ce.points_vert,fragmentShader:Ce.points_frag},dashed:{uniforms:Ht([ce.common,ce.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ce.linedashed_vert,fragmentShader:Ce.linedashed_frag},depth:{uniforms:Ht([ce.common,ce.displacementmap]),vertexShader:Ce.depth_vert,fragmentShader:Ce.depth_frag},normal:{uniforms:Ht([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,{opacity:{value:1}}]),vertexShader:Ce.meshnormal_vert,fragmentShader:Ce.meshnormal_frag},sprite:{uniforms:Ht([ce.sprite,ce.fog]),vertexShader:Ce.sprite_vert,fragmentShader:Ce.sprite_frag},background:{uniforms:{uvTransform:{value:new He},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ce.background_vert,fragmentShader:Ce.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new He}},vertexShader:Ce.backgroundCube_vert,fragmentShader:Ce.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ce.cube_vert,fragmentShader:Ce.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ce.equirect_vert,fragmentShader:Ce.equirect_frag},distance:{uniforms:Ht([ce.common,ce.displacementmap,{referencePosition:{value:new ne},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ce.distance_vert,fragmentShader:Ce.distance_frag},shadow:{uniforms:Ht([ce.lights,ce.fog,{color:{value:new ye(0)},opacity:{value:1}}]),vertexShader:Ce.shadow_vert,fragmentShader:Ce.shadow_frag}};Jt.physical={uniforms:Ht([Jt.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new He},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new He},clearcoatNormalScale:{value:new je(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new He},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new He},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new He},sheen:{value:0},sheenColor:{value:new ye(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new He},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new He},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new He},transmissionSamplerSize:{value:new je},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new He},attenuationDistance:{value:0},attenuationColor:{value:new ye(0)},specularColor:{value:new ye(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new He},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new He},anisotropyVector:{value:new je},anisotropyMap:{value:null},anisotropyMapTransform:{value:new He}}]),vertexShader:Ce.meshphysical_vert,fragmentShader:Ce.meshphysical_frag};var ui={r:0,b:0,g:0},dg=new $t,Mu=new He;Mu.set(-1,0,0,0,1,0,0,0,1);function hg(e,n,t,r,o,i){let a=new ye(0),s=o===!0?0:1,l,c,f=null,u=0,d=null;function h(S){let M=S.isScene===!0?S.background:null;if(M&&M.isTexture){let g=S.backgroundBlurriness>0;M=n.get(M,g)}return M}function _(S){let M=!1,g=h(S);g===null?m(a,s):g&&g.isColor&&(m(g,1),M=!0);let E=e.xr.getEnvironmentBlendMode();E==="additive"?t.buffers.color.setClear(0,0,0,1,i):E==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,i),(e.autoClear||M)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function T(S,M){let g=h(M);g&&(g.isCubeTexture||g.mapping===lo)?(c===void 0&&(c=new Rt(new li(1,1,1),new Qt({name:"BackgroundCubeMaterial",uniforms:fi(Jt.backgroundCube.uniforms),vertexShader:Jt.backgroundCube.vertexShader,fragmentShader:Jt.backgroundCube.fragmentShader,side:kt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(E,b,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(c)),c.material.uniforms.envMap.value=g,c.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(dg.makeRotationFromEuler(M.backgroundRotation)).transpose(),g.isCubeTexture&&g.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Mu),c.material.toneMapped=ct.getTransfer(g.colorSpace)!==tt,(f!==g||u!==g.version||d!==e.toneMapping)&&(c.material.needsUpdate=!0,f=g,u=g.version,d=e.toneMapping),c.layers.enableAll(),S.unshift(c,c.geometry,c.material,0,0,null)):g&&g.isTexture&&(l===void 0&&(l=new Rt(new Ct(2,2),new Qt({name:"BackgroundMaterial",uniforms:fi(Jt.background.uniforms),vertexShader:Jt.background.vertexShader,fragmentShader:Jt.background.fragmentShader,side:Rr,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(l)),l.material.uniforms.t2D.value=g,l.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,l.material.toneMapped=ct.getTransfer(g.colorSpace)!==tt,g.matrixAutoUpdate===!0&&g.updateMatrix(),l.material.uniforms.uvTransform.value.copy(g.matrix),(f!==g||u!==g.version||d!==e.toneMapping)&&(l.material.needsUpdate=!0,f=g,u=g.version,d=e.toneMapping),l.layers.enableAll(),S.unshift(l,l.geometry,l.material,0,0,null))}function m(S,M){S.getRGB(ui,gs(e)),t.buffers.color.setClear(ui.r,ui.g,ui.b,M,i)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(S,M=1){a.set(S),s=M,m(a,s)},getClearAlpha:function(){return s},setClearAlpha:function(S){s=S,m(a,s)},render:_,addToRenderList:T,dispose:p}}function pg(e,n){let t=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},o=d(null),i=o,a=!1;function s(P,D,I,L,H){let z=!1,F=u(P,L,I,D);i!==F&&(i=F,c(i.object)),z=h(P,L,I,H),z&&_(P,L,I,H),H!==null&&n.update(H,e.ELEMENT_ARRAY_BUFFER),(z||a)&&(a=!1,g(P,D,I,L),H!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,n.get(H).buffer))}function l(){return e.createVertexArray()}function c(P){return e.bindVertexArray(P)}function f(P){return e.deleteVertexArray(P)}function u(P,D,I,L){let H=L.wireframe===!0,z=r[D.id];z===void 0&&(z={},r[D.id]=z);let F=P.isInstancedMesh===!0?P.id:0,X=z[F];X===void 0&&(X={},z[F]=X);let $=X[I.id];$===void 0&&($={},X[I.id]=$);let j=$[H];return j===void 0&&(j=d(l()),$[H]=j),j}function d(P){let D=[],I=[],L=[];for(let H=0;H<t;H++)D[H]=0,I[H]=0,L[H]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:D,enabledAttributes:I,attributeDivisors:L,object:P,attributes:{},index:null}}function h(P,D,I,L){let H=i.attributes,z=D.attributes,F=0,X=I.getAttributes();for(let $ in X)if(X[$].location>=0){let Z=H[$],ge=z[$];if(ge===void 0&&($==="instanceMatrix"&&P.instanceMatrix&&(ge=P.instanceMatrix),$==="instanceColor"&&P.instanceColor&&(ge=P.instanceColor)),Z===void 0||Z.attribute!==ge||ge&&Z.data!==ge.data)return!0;F++}return i.attributesNum!==F||i.index!==L}function _(P,D,I,L){let H={},z=D.attributes,F=0,X=I.getAttributes();for(let $ in X)if(X[$].location>=0){let Z=z[$];Z===void 0&&($==="instanceMatrix"&&P.instanceMatrix&&(Z=P.instanceMatrix),$==="instanceColor"&&P.instanceColor&&(Z=P.instanceColor));let ge={};ge.attribute=Z,Z&&Z.data&&(ge.data=Z.data),H[$]=ge,F++}i.attributes=H,i.attributesNum=F,i.index=L}function T(){let P=i.newAttributes;for(let D=0,I=P.length;D<I;D++)P[D]=0}function m(P){p(P,0)}function p(P,D){let I=i.newAttributes,L=i.enabledAttributes,H=i.attributeDivisors;I[P]=1,L[P]===0&&(e.enableVertexAttribArray(P),L[P]=1),H[P]!==D&&(e.vertexAttribDivisor(P,D),H[P]=D)}function S(){let P=i.newAttributes,D=i.enabledAttributes;for(let I=0,L=D.length;I<L;I++)D[I]!==P[I]&&(e.disableVertexAttribArray(I),D[I]=0)}function M(P,D,I,L,H,z,F){F===!0?e.vertexAttribIPointer(P,D,I,H,z):e.vertexAttribPointer(P,D,I,L,H,z)}function g(P,D,I,L){T();let H=L.attributes,z=I.getAttributes(),F=D.defaultAttributeValues;for(let X in z){let $=z[X];if($.location>=0){let j=H[X];if(j===void 0&&(X==="instanceMatrix"&&P.instanceMatrix&&(j=P.instanceMatrix),X==="instanceColor"&&P.instanceColor&&(j=P.instanceColor)),j!==void 0){let Z=j.normalized,ge=j.itemSize,Ee=n.get(j);if(Ee===void 0)continue;let ze=Ee.buffer,$e=Ee.type,We=Ee.bytesPerElement,q=$e===e.INT||$e===e.UNSIGNED_INT||j.gpuType===xa;if(j.isInterleavedBufferAttribute){let J=j.data,xe=J.stride,Ue=j.offset;if(J.isInstancedInterleavedBuffer){for(let _e=0;_e<$.locationSize;_e++)p($.location+_e,J.meshPerAttribute);P.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let _e=0;_e<$.locationSize;_e++)m($.location+_e);e.bindBuffer(e.ARRAY_BUFFER,ze);for(let _e=0;_e<$.locationSize;_e++)M($.location+_e,ge/$.locationSize,$e,Z,xe*We,(Ue+ge/$.locationSize*_e)*We,q)}else{if(j.isInstancedBufferAttribute){for(let J=0;J<$.locationSize;J++)p($.location+J,j.meshPerAttribute);P.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let J=0;J<$.locationSize;J++)m($.location+J);e.bindBuffer(e.ARRAY_BUFFER,ze);for(let J=0;J<$.locationSize;J++)M($.location+J,ge/$.locationSize,$e,Z,ge*We,ge/$.locationSize*J*We,q)}}else if(F!==void 0){let Z=F[X];if(Z!==void 0)switch(Z.length){case 2:e.vertexAttrib2fv($.location,Z);break;case 3:e.vertexAttrib3fv($.location,Z);break;case 4:e.vertexAttrib4fv($.location,Z);break;default:e.vertexAttrib1fv($.location,Z)}}}}S()}function E(){w();for(let P in r){let D=r[P];for(let I in D){let L=D[I];for(let H in L){let z=L[H];for(let F in z)f(z[F].object),delete z[F];delete L[H]}}delete r[P]}}function b(P){if(r[P.id]===void 0)return;let D=r[P.id];for(let I in D){let L=D[I];for(let H in L){let z=L[H];for(let F in z)f(z[F].object),delete z[F];delete L[H]}}delete r[P.id]}function R(P){for(let D in r){let I=r[D];for(let L in I){let H=I[L];if(H[P.id]===void 0)continue;let z=H[P.id];for(let F in z)f(z[F].object),delete z[F];delete H[P.id]}}}function v(P){for(let D in r){let I=r[D],L=P.isInstancedMesh===!0?P.id:0,H=I[L];if(H!==void 0){for(let z in H){let F=H[z];for(let X in F)f(F[X].object),delete F[X];delete H[z]}delete I[L],Object.keys(I).length===0&&delete r[D]}}}function w(){y(),a=!0,i!==o&&(i=o,c(i.object))}function y(){o.geometry=null,o.program=null,o.wireframe=!1}return{setup:s,reset:w,resetDefaultState:y,dispose:E,releaseStatesOfGeometry:b,releaseStatesOfObject:v,releaseStatesOfProgram:R,initAttributes:T,enableAttribute:m,disableUnusedAttributes:S}}function mg(e,n,t){let r;function o(l){r=l}function i(l,c){e.drawArrays(r,l,c),t.update(c,r,1)}function a(l,c,f){f!==0&&(e.drawArraysInstanced(r,l,c,f),t.update(c,r,f))}function s(l,c,f){if(f===0)return;n.get("WEBGL_multi_draw").multiDrawArraysWEBGL(r,l,0,c,0,f);let d=0;for(let h=0;h<f;h++)d+=c[h];t.update(d,r,1)}this.setMode=o,this.render=i,this.renderInstances=a,this.renderMultiDraw=s}function gg(e,n,t,r){let o;function i(){if(o!==void 0)return o;if(n.has("EXT_texture_filter_anisotropic")===!0){let R=n.get("EXT_texture_filter_anisotropic");o=e.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else o=0;return o}function a(R){return!(R!==Zt&&r.convert(R)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function s(R){let v=R===Sn&&(n.has("EXT_color_buffer_half_float")||n.has("EXT_color_buffer_float"));return!(R!==Wt&&R!==yn&&!v&&r.convert(R)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function l(R){if(R==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",f=l(c);f!==c&&(qe("WebGLRenderer:",c,"not supported, using",f,"instead."),c=f);let u=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&n.has("EXT_clip_control");t.reversedDepthBuffer===!0&&d===!1&&qe("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let h=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),_=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),T=e.getParameter(e.MAX_TEXTURE_SIZE),m=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),p=e.getParameter(e.MAX_VERTEX_ATTRIBS),S=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),M=e.getParameter(e.MAX_VARYING_VECTORS),g=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),E=e.getParameter(e.MAX_SAMPLES),b=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:i,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:s,precision:c,logarithmicDepthBuffer:u,reversedDepthBuffer:d,maxTextures:h,maxVertexTextures:_,maxTextureSize:T,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:S,maxVaryings:M,maxFragmentUniforms:g,maxSamples:E,samples:b}}function _g(e){let n=this,t=null,r=0,o=!1,i=!1,a=new Of,s=new He,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let h=u.length!==0||d||r!==0||o;return o=d,r=u.length,h},this.beginShadows=function(){i=!0,f(null)},this.endShadows=function(){i=!1},this.setGlobalState=function(u,d){t=f(u,d,0)},this.setState=function(u,d,h){let _=u.clippingPlanes,T=u.clipIntersection,m=u.clipShadows,p=e.get(u);if(!o||_===null||_.length===0||i&&!m)i?f(null):c();else{let S=i?0:r,M=S*4,g=p.clippingState||null;l.value=g,g=f(_,d,M,h);for(let E=0;E!==M;++E)g[E]=t[E];p.clippingState=g,this.numIntersection=T?this.numPlanes:0,this.numPlanes+=S}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=r>0),n.numPlanes=r,n.numIntersection=0}function f(u,d,h,_){let T=u!==null?u.length:0,m=null;if(T!==0){if(m=l.value,_!==!0||m===null){let p=h+T*4,S=d.matrixWorldInverse;s.getNormalMatrix(S),(m===null||m.length<p)&&(m=new Float32Array(p));for(let M=0,g=h;M!==T;++M,g+=4)a.copy(u[M]).applyMatrix4(S,s),a.normal.toArray(m,g),m[g+3]=a.constant}l.value=m,l.needsUpdate=!0}return n.numPlanes=T,n.numIntersection=0,m}}var Nr=4,vg=6,Sg=20,xg=256,_o=new vs,Jf=new ye,ws=null,As=0,Rs=0,ys=!1,Eg=new ne,rr=new ne,hi=class{constructor(n){this._renderer=n,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(n,t=0,r=.1,o=100,i={}){let{size:a=256,position:s=Eg}=i;ws=this._renderer.getRenderTarget(),As=this._renderer.getActiveCubeFace(),Rs=this._renderer.getActiveMipmapLevel(),ys=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(n,r,o,l,s),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(n,t=null){return this._fromTexture(n,t)}fromCubemap(n,t=null){return this._fromTexture(n,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=nu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=tu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(n){this._lodMax=Math.floor(Math.log2(n)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let n=0;n<this._lodMeshes.length;n++)this._lodMeshes[n].geometry.dispose()}_cleanup(n){this._renderer.setRenderTarget(ws,As,Rs),this._renderer.xr.enabled=ys,n.scissorTest=!1,Ir(n,0,0,n.width,n.height)}_fromTexture(n,t){n.mapping===Cr||n.mapping===Qn?this._setSize(n.image.length===0?16:n.image[0].width||n.image[0].image.width):this._setSize(n.image.width/4),ws=this._renderer.getRenderTarget(),As=this._renderer.getActiveCubeFace(),Rs=this._renderer.getActiveMipmapLevel(),ys=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let r=t||this._allocateTargets();return this._textureToCubeUV(n,r),this._applyPMREM(r),this._cleanup(r),r}_allocateTargets(){let n=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,r={magFilter:St,minFilter:St,generateMipmaps:!1,type:Sn,format:Zt,colorSpace:rs,depthBuffer:!1},o=eu(n,t,r);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==n||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=eu(n,t,r);let{_lodMax:i}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Mg(i)),this._blurMaterial=bg(i,n,t),this._ggxMaterial=Tg(i,n,t)}return o}_compileMaterial(n){let t=new Rt(new xt,n);this._renderer.compile(t,_o)}_sceneToCubeUV(n,t,r,o,i){let l=new po(90,1,t,r),c=[1,-1,1,1,1,1],f=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,h=u.toneMapping;u.getClearColor(Jf),u.toneMapping=ln,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(o),u.clearDepth(),u.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Rt(new li,new Ff({name:"PMREM.Background",side:kt,depthWrite:!1,depthTest:!1})));let T=this._backgroundBox,m=T.material,p=!1,S=n.background;S?S.isColor&&(m.color.copy(S),n.background=null,p=!0):(m.color.copy(Jf),p=!0);for(let M=0;M<6;M++){let g=M%3;g===0?(l.up.set(0,c[M],0),l.position.set(i.x,i.y,i.z),l.lookAt(i.x+f[M],i.y,i.z)):g===1?(l.up.set(0,0,c[M]),l.position.set(i.x,i.y,i.z),l.lookAt(i.x,i.y+f[M],i.z)):(l.up.set(0,c[M],0),l.position.set(i.x,i.y,i.z),l.lookAt(i.x,i.y,i.z+f[M]));let E=this._cubeSize;Ir(o,g*E,M>2?E:0,E,E),u.setRenderTarget(o),p&&u.render(T,l),u.render(n,l)}u.toneMapping=h,u.autoClear=d,n.background=S}_textureToCubeUV(n,t){let r=this._renderer,o=n.mapping===Cr||n.mapping===Qn;o?(this._cubemapMaterial===null&&(this._cubemapMaterial=nu()),this._cubemapMaterial.uniforms.flipEnvMap.value=n.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=tu());let i=o?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=i;let s=i.uniforms;s.envMap.value=n;let l=this._cubeSize;Ir(t,0,0,3*l,2*l),r.setRenderTarget(t),r.render(a,_o)}_applyPMREM(n){let t=this._renderer,r=t.autoClear;t.autoClear=!1;let o=this._lodMeshes.length;for(let i=1;i<o;i++)this._applyGGXFilter(n,i-1,i);t.autoClear=r}_applyGGXFilter(n,t,r){let o=this._renderer,i=this._pingPongRenderTarget,a=this._ggxMaterial,s=this._lodMeshes[r];s.material=a;let l=a.uniforms,c=r/(this._lodMeshes.length-1),f=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-f*f),d=c*1.25,h=u*d,{_lodMax:_}=this,T=this._sizeLods[r],m=3*T*(r>_-Nr?r-_+Nr:0),p=4*(this._cubeSize-T);l.envMap.value=n.texture,l.roughness.value=h,l.mipInt.value=_-t,Ir(i,m,p,3*T,2*T),o.setRenderTarget(i),o.render(s,_o),l.envMap.value=i.texture,l.roughness.value=0,l.mipInt.value=_-r,Ir(n,m,p,3*T,2*T),o.setRenderTarget(n),o.render(s,_o)}_blur(n,t,r,o){let i=this._pingPongRenderTarget,a=Math.min(o,Math.PI)/Math.SQRT2;this._blurPass(n,i,t,r,a),this._blurPass(i,n,r,r,a)}_blurPass(n,t,r,o,i){let a=this._renderer,s=this._blurMaterial,l=this._lodMeshes[o];l.material=s;let c=s.uniforms;c.envMap.value=n.texture,c.sigma.value=i,c.mipInt.value=this._lodMax-r;let f=this._sizeLods[o],u=3*f*(o>this._lodMax-Nr?o-this._lodMax+Nr:0),d=4*(this._cubeSize-f);Ir(t,u,d,3*f,2*f),a.setRenderTarget(t),a.render(l,_o)}};function Mg(e){let n=[],t=[],r=e,o=e-Nr+1+vg;for(let i=0;i<o;i++){let a=Math.pow(2,r);n.push(a);let s=1/(a-2),l=-s,c=1+s,f=[l,l,c,l,c,c,l,l,c,c,l,c],u=6,d=6,h=3,_=new Float32Array(h*d*u),T=new Float32Array(h*d*u);for(let p=0;p<u;p++){let S=p%3*2/3-1,M=p>2?0:-1,g=[S,M,0,S+2/3,M,0,S+2/3,M+1,0,S,M,0,S+2/3,M+1,0,S,M+1,0];_.set(g,h*d*p);for(let E=0;E<d;E++){let b=f[E*2]*2-1,R=f[E*2+1]*2-1;p===0?rr.set(1,R,b):p===1?rr.set(-b,1,-R):p===2?rr.set(-b,R,1):p===3?rr.set(-1,R,-b):p===4?rr.set(-b,-1,R):rr.set(b,R,-1),rr.toArray(T,(p*d+E)*h)}}let m=new xt;m.setAttribute("position",new Ge(_,h)),m.setAttribute("outputDirection",new Ge(T,h)),t.push(new Rt(m,null)),r>Nr&&r--}return{lodMeshes:t,sizeLods:n}}function eu(e,n,t){let r=new jt(e,n,t);return r.texture.mapping=lo,r.texture.name="PMREM.cubeUv",r.scissorTest=!0,r}function Ir(e,n,t,r,o){e.viewport.set(n,t,r,o),e.scissor.set(n,t,r,o)}function Tg(e,n,t){return new Qt({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:xg,CUBEUV_TEXEL_WIDTH:1/n,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:mi(),fragmentShader:`

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
		`,blending:vn,depthTest:!1,depthWrite:!1})}function bg(e,n,t){return new Qt({name:"SphericalGaussianBlur",defines:{SAMPLES:Sg,CUBEUV_TEXEL_WIDTH:1/n,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:mi(),fragmentShader:`

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
		`,blending:vn,depthTest:!1,depthWrite:!1})}function tu(){return new Qt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:mi(),fragmentShader:`

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
		`,blending:vn,depthTest:!1,depthWrite:!1})}function nu(){return new Qt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:mi(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:vn,depthTest:!1,depthWrite:!1})}function mi(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var pi=class extends jt{constructor(n=1,t={}){super(n,n,t),this.isWebGLCubeRenderTarget=!0;let r={width:n,height:n,depth:1},o=[r,r,r,r,r,r];this.texture=new hs(o),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(n,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let r={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},o=new li(5,5,5),i=new Qt({name:"CubemapFromEquirect",uniforms:fi(r.uniforms),vertexShader:r.vertexShader,fragmentShader:r.fragmentShader,side:kt,blending:vn});i.uniforms.tEquirect.value=t;let a=new Rt(o,i),s=t.minFilter;return t.minFilter===zt&&(t.minFilter=St),new zf(1,10,this).update(n,a),t.minFilter=s,a.geometry.dispose(),a.material.dispose(),this}clear(n,t=!0,r=!0,o=!0){let i=n.getRenderTarget();for(let a=0;a<6;a++)n.setRenderTarget(this,a),n.clear(t,r,o);n.setRenderTarget(i)}};function wg(e){let n=new WeakMap,t=new WeakMap,r=null;function o(d,h=!1){return d==null?null:h?a(d):i(d)}function i(d){if(d&&d.isTexture){let h=d.mapping;if(h===Yo||h===Ko)if(n.has(d)){let _=n.get(d).texture;return s(_,d.mapping)}else{let _=d.image;if(_&&_.height>0){let T=new pi(_.height);return T.fromEquirectangularTexture(e,d),n.set(d,T),d.addEventListener("dispose",c),s(T.texture,d.mapping)}else return null}}return d}function a(d){if(d&&d.isTexture){let h=d.mapping,_=h===Yo||h===Ko,T=h===Cr||h===Qn;if(_||T){let m=t.get(d),p=m!==void 0?m.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==p)return r===null&&(r=new hi(e)),m=_?r.fromEquirectangular(d,m):r.fromCubemap(d,m),m.texture.pmremVersion=d.pmremVersion,t.set(d,m),m.texture;if(m!==void 0)return m.texture;{let S=d.image;return _&&S&&S.height>0||T&&S&&l(S)?(r===null&&(r=new hi(e)),m=_?r.fromEquirectangular(d):r.fromCubemap(d),m.texture.pmremVersion=d.pmremVersion,t.set(d,m),d.addEventListener("dispose",f),m.texture):null}}}return d}function s(d,h){return h===Yo?d.mapping=Cr:h===Ko&&(d.mapping=Qn),d}function l(d){let h=0,_=6;for(let T=0;T<_;T++)d[T]!==void 0&&h++;return h===_}function c(d){let h=d.target;h.removeEventListener("dispose",c);let _=n.get(h);_!==void 0&&(n.delete(h),_.dispose())}function f(d){let h=d.target;h.removeEventListener("dispose",f);let _=t.get(h);_!==void 0&&(t.delete(h),_.dispose())}function u(){n=new WeakMap,t=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:o,dispose:u}}function Ag(e){let n={};function t(r){if(n[r]!==void 0)return n[r];let o=e.getExtension(r);return n[r]=o,o}return{has:function(r){return t(r)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(r){let o=t(r);return o===null&&Af("WebGLRenderer: "+r+" extension not supported."),o}}}function Rg(e,n,t,r){let o={},i=new WeakMap;function a(u){let d=u.target;d.index!==null&&n.remove(d.index);for(let _ in d.attributes)n.remove(d.attributes[_]);d.removeEventListener("dispose",a),delete o[d.id];let h=i.get(d);h&&(n.remove(h),i.delete(d)),r.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function s(u,d){return o[d.id]===!0||(d.addEventListener("dispose",a),o[d.id]=!0,t.memory.geometries++),d}function l(u){let d=u.attributes;for(let h in d)n.update(d[h],e.ARRAY_BUFFER)}function c(u){let d=[],h=u.index,_=u.attributes.position,T=0;if(_===void 0)return;if(h!==null){let S=h.array;T=h.version;for(let M=0,g=S.length;M<g;M+=3){let E=S[M+0],b=S[M+1],R=S[M+2];d.push(E,b,b,R,R,E)}}else{let S=_.array;T=_.version;for(let M=0,g=S.length/3-1;M<g;M+=3){let E=M+0,b=M+1,R=M+2;d.push(E,b,b,R,R,E)}}let m=new(_.count>=65535?Nf:If)(d,1);m.version=T;let p=i.get(u);p&&n.remove(p),i.set(u,m)}function f(u){let d=i.get(u);if(d){let h=u.index;h!==null&&d.version<h.version&&c(u)}else c(u);return i.get(u)}return{get:s,update:l,getWireframeAttribute:f}}function yg(e,n,t){let r;function o(u){r=u}let i,a;function s(u){i=u.type,a=u.bytesPerElement}function l(u,d){e.drawElements(r,d,i,u*a),t.update(d,r,1)}function c(u,d,h){h!==0&&(e.drawElementsInstanced(r,d,i,u*a,h),t.update(d,r,h))}function f(u,d,h){if(h===0)return;n.get("WEBGL_multi_draw").multiDrawElementsWEBGL(r,d,0,i,u,0,h);let T=0;for(let m=0;m<h;m++)T+=d[m];t.update(T,r,1)}this.setMode=o,this.setIndex=s,this.render=l,this.renderInstances=c,this.renderMultiDraw=f}function Cg(e){let n={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function r(i,a,s){switch(t.calls++,a){case e.TRIANGLES:t.triangles+=s*(i/3);break;case e.LINES:t.lines+=s*(i/2);break;case e.LINE_STRIP:t.lines+=s*(i-1);break;case e.LINE_LOOP:t.lines+=s*i;break;case e.POINTS:t.points+=s*i;break;default:it("WebGLInfo: Unknown draw mode:",a);break}}function o(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:n,render:t,programs:null,autoReset:!0,reset:o,update:r}}function Pg(e,n,t){let r=new WeakMap,o=new Ft;function i(a,s,l){let c=a.morphTargetInfluences,f=s.morphAttributes.position||s.morphAttributes.normal||s.morphAttributes.color,u=f!==void 0?f.length:0,d=r.get(s);if(d===void 0||d.count!==u){let w=function(){R.dispose(),r.delete(s),s.removeEventListener("dispose",w)};d!==void 0&&d.texture.dispose();let h=s.morphAttributes.position!==void 0,_=s.morphAttributes.normal!==void 0,T=s.morphAttributes.color!==void 0,m=s.morphAttributes.position||[],p=s.morphAttributes.normal||[],S=s.morphAttributes.color||[],M=0;h===!0&&(M=1),_===!0&&(M=2),T===!0&&(M=3);let g=s.attributes.position.count*M,E=1;g>n.maxTextureSize&&(E=Math.ceil(g/n.maxTextureSize),g=n.maxTextureSize);let b=new Float32Array(g*E*4*u),R=new Dr(b,g,E,u);R.type=yn,R.needsUpdate=!0;let v=M*4;for(let y=0;y<u;y++){let P=m[y],D=p[y],I=S[y],L=g*E*4*y;for(let H=0;H<P.count;H++){let z=H*v;h===!0&&(o.fromBufferAttribute(P,H),b[L+z+0]=o.x,b[L+z+1]=o.y,b[L+z+2]=o.z,b[L+z+3]=0),_===!0&&(o.fromBufferAttribute(D,H),b[L+z+4]=o.x,b[L+z+5]=o.y,b[L+z+6]=o.z,b[L+z+7]=0),T===!0&&(o.fromBufferAttribute(I,H),b[L+z+8]=o.x,b[L+z+9]=o.y,b[L+z+10]=o.z,b[L+z+11]=I.itemSize===4?o.w:1)}}d={count:u,texture:R,size:new je(g,E)},r.set(s,d),s.addEventListener("dispose",w)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(e,"morphTexture",a.morphTexture,t);else{let h=0;for(let T=0;T<c.length;T++)h+=c[T];let _=s.morphTargetsRelative?1:1-h;l.getUniforms().setValue(e,"morphTargetBaseInfluence",_),l.getUniforms().setValue(e,"morphTargetInfluences",c)}l.getUniforms().setValue(e,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(e,"morphTargetsTextureSize",d.size)}return{update:i}}function Lg(e,n,t,r,o){let i=new WeakMap;function a(c){let f=o.render.frame,u=c.geometry,d=n.get(c,u);if(i.get(d)!==f&&(n.update(d),i.set(d,f)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),i.get(c)!==f&&(t.update(c.instanceMatrix,e.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,e.ARRAY_BUFFER),i.set(c,f))),c.isSkinnedMesh){let h=c.skeleton;i.get(h)!==f&&(h.update(),i.set(h,f))}return d}function s(){i=new WeakMap}function l(c){let f=c.target;f.removeEventListener("dispose",l),r.releaseStatesOfObject(f),t.remove(f.instanceMatrix),f.instanceColor!==null&&t.remove(f.instanceColor)}return{update:a,dispose:s}}var Dg={[ha]:"LINEAR_TONE_MAPPING",[pa]:"REINHARD_TONE_MAPPING",[ma]:"CINEON_TONE_MAPPING",[ga]:"ACES_FILMIC_TONE_MAPPING",[va]:"AGX_TONE_MAPPING",[Sa]:"NEUTRAL_TONE_MAPPING",[_a]:"CUSTOM_TONE_MAPPING"};function Ug(e,n,t,r,o,i){let a=new jt(n,t,{type:e,depthBuffer:o,stencilBuffer:i,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,l=null,c=new xt;c.setAttribute("position",new Yt([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new Yt([0,2,0,0,2,0],2));let f=new Gf({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),u=new Rt(c,f),d=new vs(-1,1,1,-1,0,1),h=null,_=null,T=!1,m,p=null,S=[],M=!1;this.setSize=function(g,E){a.setSize(g,E),s!==null&&s.setSize(g,E),l!==null&&l.setSize(g,E);for(let b=0;b<S.length;b++){let R=S[b];R.setSize&&R.setSize(g,E)}},this.setEffects=function(g){S=g,M=S.length>0&&S[0].isRenderPass===!0;let E=a.width,b=a.height;S.length>0&&s===null&&(s=new jt(E,b,{type:Sn,depthBuffer:!1,stencilBuffer:!1}),l=new jt(E,b,{type:Sn,depthBuffer:!1,stencilBuffer:!1}));for(let R=0;R<S.length;R++){let v=S[R];v.setSize&&v.setSize(E,b)}},this.begin=function(g,E){if(T||g.toneMapping===ln&&S.length===0)return!1;if(p=E,E!==null){let b=E.width,R=E.height;(a.width!==b||a.height!==R)&&this.setSize(b,R)}return M===!1&&g.setRenderTarget(a),m=g.toneMapping,g.toneMapping=ln,!0},this.hasRenderPass=function(){return M},this.end=function(g,E){g.toneMapping=m,T=!0;let b=a,R=s;for(let v=0;v<S.length;v++){let w=S[v];w.enabled!==!1&&(w.render(g,R,b,E),w.needsSwap!==!1&&(b=R,R=R===s?l:s))}if(h!==g.outputColorSpace||_!==g.toneMapping){h=g.outputColorSpace,_=g.toneMapping,f.defines={},ct.getTransfer(h)===tt&&(f.defines.SRGB_TRANSFER="");let v=Dg[_];v&&(f.defines[v]=""),f.needsUpdate=!0}f.uniforms.tDiffuse.value=b.texture,g.setRenderTarget(p),g.render(u,d),p=null,T=!1},this.isCompositing=function(){return T},this.dispose=function(){a.dispose(),s!==null&&s.dispose(),l!==null&&l.dispose(),c.dispose(),f.dispose()}}var Tu=new Lf,Ls=new ho(1,1),bu=new Dr,wu=new Df,Au=new hs,ru=[],ou=[],iu=new Float32Array(16),au=new Float32Array(9),su=new Float32Array(4);function Fr(e,n,t){let r=e[0];if(r<=0||r>0)return e;let o=n*t,i=ru[o];if(i===void 0&&(i=new Float32Array(o),ru[o]=i),n!==0){r.toArray(i,0);for(let a=1,s=0;a!==n;++a)s+=t,e[a].toArray(i,s)}return i}function Tt(e,n){if(e.length!==n.length)return!1;for(let t=0,r=e.length;t<r;t++)if(e[t]!==n[t])return!1;return!0}function bt(e,n){for(let t=0,r=n.length;t<r;t++)e[t]=n[t]}function gi(e,n){let t=ou[n];t===void 0&&(t=new Int32Array(n),ou[n]=t);for(let r=0;r!==n;++r)t[r]=e.allocateTextureUnit();return t}function Ig(e,n){let t=this.cache;t[0]!==n&&(e.uniform1f(this.addr,n),t[0]=n)}function Ng(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2f(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(Tt(t,n))return;e.uniform2fv(this.addr,n),bt(t,n)}}function Og(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3f(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else if(n.r!==void 0)(t[0]!==n.r||t[1]!==n.g||t[2]!==n.b)&&(e.uniform3f(this.addr,n.r,n.g,n.b),t[0]=n.r,t[1]=n.g,t[2]=n.b);else{if(Tt(t,n))return;e.uniform3fv(this.addr,n),bt(t,n)}}function Fg(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4f(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(Tt(t,n))return;e.uniform4fv(this.addr,n),bt(t,n)}}function Hg(e,n){let t=this.cache,r=n.elements;if(r===void 0){if(Tt(t,n))return;e.uniformMatrix2fv(this.addr,!1,n),bt(t,n)}else{if(Tt(t,r))return;su.set(r),e.uniformMatrix2fv(this.addr,!1,su),bt(t,r)}}function Bg(e,n){let t=this.cache,r=n.elements;if(r===void 0){if(Tt(t,n))return;e.uniformMatrix3fv(this.addr,!1,n),bt(t,n)}else{if(Tt(t,r))return;au.set(r),e.uniformMatrix3fv(this.addr,!1,au),bt(t,r)}}function Gg(e,n){let t=this.cache,r=n.elements;if(r===void 0){if(Tt(t,n))return;e.uniformMatrix4fv(this.addr,!1,n),bt(t,n)}else{if(Tt(t,r))return;iu.set(r),e.uniformMatrix4fv(this.addr,!1,iu),bt(t,r)}}function kg(e,n){let t=this.cache;t[0]!==n&&(e.uniform1i(this.addr,n),t[0]=n)}function Vg(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2i(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(Tt(t,n))return;e.uniform2iv(this.addr,n),bt(t,n)}}function zg(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3i(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else{if(Tt(t,n))return;e.uniform3iv(this.addr,n),bt(t,n)}}function Wg(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4i(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(Tt(t,n))return;e.uniform4iv(this.addr,n),bt(t,n)}}function Xg(e,n){let t=this.cache;t[0]!==n&&(e.uniform1ui(this.addr,n),t[0]=n)}function $g(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2ui(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(Tt(t,n))return;e.uniform2uiv(this.addr,n),bt(t,n)}}function Yg(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3ui(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else{if(Tt(t,n))return;e.uniform3uiv(this.addr,n),bt(t,n)}}function Kg(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4ui(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(Tt(t,n))return;e.uniform4uiv(this.addr,n),bt(t,n)}}function qg(e,n,t){let r=this.cache,o=t.allocateTextureUnit();r[0]!==o&&(e.uniform1i(this.addr,o),r[0]=o);let i;this.type===e.SAMPLER_2D_SHADOW?(Ls.compareFunction=t.isReversedDepthBuffer()?ii:oi,i=Ls):i=Tu,t.setTexture2D(n||i,o)}function Zg(e,n,t){let r=this.cache,o=t.allocateTextureUnit();r[0]!==o&&(e.uniform1i(this.addr,o),r[0]=o),t.setTexture3D(n||wu,o)}function jg(e,n,t){let r=this.cache,o=t.allocateTextureUnit();r[0]!==o&&(e.uniform1i(this.addr,o),r[0]=o),t.setTextureCube(n||Au,o)}function Qg(e,n,t){let r=this.cache,o=t.allocateTextureUnit();r[0]!==o&&(e.uniform1i(this.addr,o),r[0]=o),t.setTexture2DArray(n||bu,o)}function Jg(e){switch(e){case 5126:return Ig;case 35664:return Ng;case 35665:return Og;case 35666:return Fg;case 35674:return Hg;case 35675:return Bg;case 35676:return Gg;case 5124:case 35670:return kg;case 35667:case 35671:return Vg;case 35668:case 35672:return zg;case 35669:case 35673:return Wg;case 5125:return Xg;case 36294:return $g;case 36295:return Yg;case 36296:return Kg;case 35678:case 36198:case 36298:case 36306:case 35682:return qg;case 35679:case 36299:case 36307:return Zg;case 35680:case 36300:case 36308:case 36293:return jg;case 36289:case 36303:case 36311:case 36292:return Qg}}function e_(e,n){e.uniform1fv(this.addr,n)}function t_(e,n){let t=Fr(n,this.size,2);e.uniform2fv(this.addr,t)}function n_(e,n){let t=Fr(n,this.size,3);e.uniform3fv(this.addr,t)}function r_(e,n){let t=Fr(n,this.size,4);e.uniform4fv(this.addr,t)}function o_(e,n){let t=Fr(n,this.size,4);e.uniformMatrix2fv(this.addr,!1,t)}function i_(e,n){let t=Fr(n,this.size,9);e.uniformMatrix3fv(this.addr,!1,t)}function a_(e,n){let t=Fr(n,this.size,16);e.uniformMatrix4fv(this.addr,!1,t)}function s_(e,n){e.uniform1iv(this.addr,n)}function l_(e,n){e.uniform2iv(this.addr,n)}function c_(e,n){e.uniform3iv(this.addr,n)}function f_(e,n){e.uniform4iv(this.addr,n)}function u_(e,n){e.uniform1uiv(this.addr,n)}function d_(e,n){e.uniform2uiv(this.addr,n)}function h_(e,n){e.uniform3uiv(this.addr,n)}function p_(e,n){e.uniform4uiv(this.addr,n)}function m_(e,n,t){let r=this.cache,o=n.length,i=gi(t,o);Tt(r,i)||(e.uniform1iv(this.addr,i),bt(r,i));let a;this.type===e.SAMPLER_2D_SHADOW?a=Ls:a=Tu;for(let s=0;s!==o;++s)t.setTexture2D(n[s]||a,i[s])}function g_(e,n,t){let r=this.cache,o=n.length,i=gi(t,o);Tt(r,i)||(e.uniform1iv(this.addr,i),bt(r,i));for(let a=0;a!==o;++a)t.setTexture3D(n[a]||wu,i[a])}function __(e,n,t){let r=this.cache,o=n.length,i=gi(t,o);Tt(r,i)||(e.uniform1iv(this.addr,i),bt(r,i));for(let a=0;a!==o;++a)t.setTextureCube(n[a]||Au,i[a])}function v_(e,n,t){let r=this.cache,o=n.length,i=gi(t,o);Tt(r,i)||(e.uniform1iv(this.addr,i),bt(r,i));for(let a=0;a!==o;++a)t.setTexture2DArray(n[a]||bu,i[a])}function S_(e){switch(e){case 5126:return e_;case 35664:return t_;case 35665:return n_;case 35666:return r_;case 35674:return o_;case 35675:return i_;case 35676:return a_;case 5124:case 35670:return s_;case 35667:case 35671:return l_;case 35668:case 35672:return c_;case 35669:case 35673:return f_;case 5125:return u_;case 36294:return d_;case 36295:return h_;case 36296:return p_;case 35678:case 36198:case 36298:case 36306:case 35682:return m_;case 35679:case 36299:case 36307:return g_;case 35680:case 36300:case 36308:case 36293:return __;case 36289:case 36303:case 36311:case 36292:return v_}}var Ds=class{constructor(n,t,r){this.id=n,this.addr=r,this.cache=[],this.type=t.type,this.setValue=Jg(t.type)}},Us=class{constructor(n,t,r){this.id=n,this.addr=r,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=S_(t.type)}},Is=class{constructor(n){this.id=n,this.seq=[],this.map={}}setValue(n,t,r){let o=this.seq;for(let i=0,a=o.length;i!==a;++i){let s=o[i];s.setValue(n,t[s.id],r)}}},Cs=/(\w+)(\])?(\[|\.)?/g;function lu(e,n){e.seq.push(n),e.map[n.id]=n}function x_(e,n,t){let r=e.name,o=r.length;for(Cs.lastIndex=0;;){let i=Cs.exec(r),a=Cs.lastIndex,s=i[1],l=i[2]==="]",c=i[3];if(l&&(s=s|0),c===void 0||c==="["&&a+2===o){lu(t,c===void 0?new Ds(s,e,n):new Us(s,e,n));break}else{let u=t.map[s];u===void 0&&(u=new Is(s),lu(t,u)),t=u}}}var Or=class{constructor(n,t){this.seq=[],this.map={};let r=n.getProgramParameter(t,n.ACTIVE_UNIFORMS);for(let a=0;a<r;++a){let s=n.getActiveUniform(t,a),l=n.getUniformLocation(t,s.name);x_(s,l,this)}let o=[],i=[];for(let a of this.seq)a.type===n.SAMPLER_2D_SHADOW||a.type===n.SAMPLER_CUBE_SHADOW||a.type===n.SAMPLER_2D_ARRAY_SHADOW?o.push(a):i.push(a);o.length>0&&(this.seq=o.concat(i))}setValue(n,t,r,o){let i=this.map[t];i!==void 0&&i.setValue(n,r,o)}setOptional(n,t,r){let o=t[r];o!==void 0&&this.setValue(n,r,o)}static upload(n,t,r,o){for(let i=0,a=t.length;i!==a;++i){let s=t[i],l=r[s.id];l.needsUpdate!==!1&&s.setValue(n,l.value,o)}}static seqWithValue(n,t){let r=[];for(let o=0,i=n.length;o!==i;++o){let a=n[o];a.id in t&&r.push(a)}return r}};function cu(e,n,t){let r=e.createShader(n);return e.shaderSource(r,t),e.compileShader(r),r}var E_=37297,M_=0;function T_(e,n){let t=e.split(`
`),r=[],o=Math.max(n-6,0),i=Math.min(n+6,t.length);for(let a=o;a<i;a++){let s=a+1;r.push(`${s===n?">":" "} ${s}: ${t[a]}`)}return r.join(`
`)}var fu=new He;function b_(e){ct._getMatrix(fu,ct.workingColorSpace,e);let n=`mat3( ${fu.elements.map(t=>t.toFixed(4))} )`;switch(ct.getTransfer(e)){case os:return[n,"LinearTransferOETF"];case tt:return[n,"sRGBTransferOETF"];default:return qe("WebGLProgram: Unsupported color space: ",e),[n,"LinearTransferOETF"]}}function uu(e,n,t){let r=e.getShaderParameter(n,e.COMPILE_STATUS),i=(e.getShaderInfoLog(n)||"").trim();if(r&&i==="")return"";let a=/ERROR: 0:(\d+)/.exec(i);if(a){let s=parseInt(a[1]);return t.toUpperCase()+`

`+i+`

`+T_(e.getShaderSource(n),s)}else return i}function w_(e,n){let t=b_(n);return[`vec4 ${e}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var A_={[ha]:"Linear",[pa]:"Reinhard",[ma]:"Cineon",[ga]:"ACESFilmic",[va]:"AgX",[Sa]:"Neutral",[_a]:"Custom"};function R_(e,n){let t=A_[n];return t===void 0?(qe("WebGLProgram: Unsupported toneMapping:",n),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+e+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var di=new ne;function y_(){ct.getLuminanceCoefficients(di);let e=di.x.toFixed(4),n=di.y.toFixed(4),t=di.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${n}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function C_(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(So).join(`
`)}function P_(e){let n=[];for(let t in e){let r=e[t];r!==!1&&n.push("#define "+t+" "+r)}return n.join(`
`)}function L_(e,n){let t={},r=e.getProgramParameter(n,e.ACTIVE_ATTRIBUTES);for(let o=0;o<r;o++){let i=e.getActiveAttrib(n,o),a=i.name,s=1;i.type===e.FLOAT_MAT2&&(s=2),i.type===e.FLOAT_MAT3&&(s=3),i.type===e.FLOAT_MAT4&&(s=4),t[a]={type:i.type,location:e.getAttribLocation(n,a),locationSize:s}}return t}function So(e){return e!==""}function du(e,n){let t=n.numSpotLightShadows+n.numSpotLightMaps-n.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,n.numSunLights).replace(/NUM_DIR_LIGHTS/g,n.numDirLights).replace(/NUM_SPOT_LIGHTS/g,n.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,n.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,n.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,n.numPointLights).replace(/NUM_HEMI_LIGHTS/g,n.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,n.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,n.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,n.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,n.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,n.numPointLightShadows)}function hu(e,n){return e.replace(/NUM_CLIPPING_PLANES/g,n.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,n.numClippingPlanes-n.numClipIntersection)}var D_=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ns(e){return e.replace(D_,I_)}var U_=new Map;function I_(e,n){let t=Ce[n];if(t===void 0){let r=U_.get(n);if(r!==void 0)t=Ce[r],qe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',n,r);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+n+">")}return Ns(t)}var N_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function pu(e){return e.replace(N_,O_)}function O_(e,n,t,r){let o="";for(let i=parseInt(n);i<parseInt(t);i++)o+=r.replace(/\[\s*i\s*\]/g,"[ "+i+" ]").replace(/UNROLLED_LOOP_INDEX/g,i);return o}function mu(e){let n=`precision ${e.precision} float;
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
#define LOW_PRECISION`),n}var F_={[ao]:"SHADOWMAP_TYPE_PCF",[Ar]:"SHADOWMAP_TYPE_VSM"};function H_(e){return F_[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var B_={[Cr]:"ENVMAP_TYPE_CUBE",[Qn]:"ENVMAP_TYPE_CUBE",[lo]:"ENVMAP_TYPE_CUBE_UV"};function G_(e){return e.envMap===!1?"ENVMAP_TYPE_CUBE":B_[e.envMapMode]||"ENVMAP_TYPE_CUBE"}var k_={[Qn]:"ENVMAP_MODE_REFRACTION"};function V_(e){return e.envMap===!1?"ENVMAP_MODE_REFLECTION":k_[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}var z_={[af]:"ENVMAP_BLENDING_MULTIPLY",[sf]:"ENVMAP_BLENDING_MIX",[lf]:"ENVMAP_BLENDING_ADD"};function W_(e){return e.envMap===!1?"ENVMAP_BLENDING_NONE":z_[e.combine]||"ENVMAP_BLENDING_NONE"}function X_(e){let n=e.envMapCubeUVHeight;if(n===null)return null;let t=Math.log2(n)-2,r=1/n;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:r,maxMip:t}}function $_(e,n,t,r){let o=e.getContext(),i=t.defines,a=t.vertexShader,s=t.fragmentShader,l=H_(t),c=G_(t),f=V_(t),u=W_(t),d=X_(t),h=C_(t),_=P_(i),T=o.createProgram(),m,p,S=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(So).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(So).join(`
`),p.length>0&&(p+=`
`)):(m=[mu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+f:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(So).join(`
`),p=[mu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+f:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==ln?"#define TONE_MAPPING":"",t.toneMapping!==ln?Ce.tonemapping_pars_fragment:"",t.toneMapping!==ln?R_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ce.colorspace_pars_fragment,w_("linearToOutputTexel",t.outputColorSpace),y_(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(So).join(`
`)),a=Ns(a),a=du(a,t),a=hu(a,t),s=Ns(s),s=du(s,t),s=hu(s,t),a=pu(a),s=pu(s),t.isRawShaderMaterial!==!0&&(S=`#version 300 es
`,m=[h,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===as?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===as?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let M=S+m+a,g=S+p+s,E=cu(o,o.VERTEX_SHADER,M),b=cu(o,o.FRAGMENT_SHADER,g);o.attachShader(T,E),o.attachShader(T,b),t.index0AttributeName!==void 0?o.bindAttribLocation(T,0,t.index0AttributeName):t.hasPositionAttribute===!0&&o.bindAttribLocation(T,0,"position"),o.linkProgram(T);function R(P){if(e.debug.checkShaderErrors){let D=o.getProgramInfoLog(T)||"",I=o.getShaderInfoLog(E)||"",L=o.getShaderInfoLog(b)||"",H=D.trim(),z=I.trim(),F=L.trim(),X=!0,$=!0;if(o.getProgramParameter(T,o.LINK_STATUS)===!1)if(X=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(o,T,E,b);else{let j=uu(o,E,"vertex"),Z=uu(o,b,"fragment");it("WebGLProgram: Shader Error "+o.getError()+" - VALIDATE_STATUS "+o.getProgramParameter(T,o.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+H+`
`+j+`
`+Z)}else H!==""?qe("WebGLProgram: Program Info Log:",H):(z===""||F==="")&&($=!1);$&&(P.diagnostics={runnable:X,programLog:H,vertexShader:{log:z,prefix:m},fragmentShader:{log:F,prefix:p}})}o.deleteShader(E),o.deleteShader(b),v=new Or(o,T),w=L_(o,T)}let v;this.getUniforms=function(){return v===void 0&&R(this),v};let w;this.getAttributes=function(){return w===void 0&&R(this),w};let y=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return y===!1&&(y=o.getProgramParameter(T,E_)),y},this.destroy=function(){r.releaseStatesOfProgram(this),o.deleteProgram(T),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=M_++,this.cacheKey=n,this.usedTimes=1,this.program=T,this.vertexShader=E,this.fragmentShader=b,this}var Y_=0,Os=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(n,t,r){let o=this._getShaderCacheForMaterial(n);return o.has(t)===!1&&(o.add(t),t.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(n){let t=this.materialCache.get(n);for(let r of t)r.usedTimes--,r.usedTimes===0&&this.shaderCache.delete(r.code);return this.materialCache.delete(n),this}getVertexShaderStage(n){return this._getShaderStage(n.vertexShader)}getFragmentShaderStage(n){return this._getShaderStage(n.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(n){let t=this.materialCache,r=t.get(n);return r===void 0&&(r=new Set,t.set(n,r)),r}_getShaderStage(n){let t=this.shaderCache,r=t.get(n);return r===void 0&&(r=new Fs(n),t.set(n,r)),r}},Fs=class{constructor(n){this.id=Y_++,this.code=n,this.usedTimes=0}};function K_(e){return e===tr||e===ni||e===ri}function q_(e,n,t,r,o,i){let a=new Uf,s=new Os,l=new Set,c=[],f=new Map,u=r.logarithmicDepthBuffer,d=r.precision,h={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(v){return l.add(v),v===0?"uv":`uv${v}`}function T(v,w,y,P,D,I){let L=P.fog,H=D.geometry,z=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?P.environment:null,F=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap,X=n.get(v.envMap||z,F),$=X&&X.mapping===lo?X.image.height:null,j=h[v.type];v.precision!==null&&(d=r.getMaxPrecision(v.precision),d!==v.precision&&qe("WebGLProgram.getParameters:",v.precision,"not supported, using",d,"instead."));let Z=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,ge=Z!==void 0?Z.length:0,Ee=0;H.morphAttributes.position!==void 0&&(Ee=1),H.morphAttributes.normal!==void 0&&(Ee=2),H.morphAttributes.color!==void 0&&(Ee=3);let ze,$e,We,q;if(j){let rt=Jt[j];ze=rt.vertexShader,$e=rt.fragmentShader}else{ze=v.vertexShader,$e=v.fragmentShader;let rt=s.getVertexShaderStage(v),Ye=s.getFragmentShaderStage(v);s.update(v,rt,Ye),We=rt.id,q=Ye.id}let J=e.getRenderTarget(),xe=e.state.buffers.depth.getReversed(),Ue=D.isInstancedMesh===!0,_e=D.isBatchedMesh===!0,Be=!!v.map,Mt=!!v.matcap,Ie=!!X,Xe=!!v.aoMap,nt=!!v.lightMap,Oe=!!v.bumpMap&&v.wireframe===!1,lt=!!v.normalMap,At=!!v.displacementMap,Bt=!!v.emissiveMap,ut=!!v.metalnessMap,_t=!!v.roughnessMap,O=v.anisotropy>0,Dt=v.clearcoat>0,Ze=v.dispersion>0,C=v.retroreflectivity>0,x=v.iridescence>0,B=v.sheen>0,V=v.transmission>0,Y=O&&!!v.anisotropyMap,re=Dt&&!!v.clearcoatMap,oe=Dt&&!!v.clearcoatNormalMap,K=Dt&&!!v.clearcoatRoughnessMap,ee=x&&!!v.iridescenceMap,ie=x&&!!v.iridescenceThicknessMap,be=B&&!!v.sheenColorMap,fe=B&&!!v.sheenRoughnessMap,ae=!!v.specularMap,we=!!v.specularColorMap,Re=!!v.specularIntensityMap,Le=V&&!!v.transmissionMap,N=V&&!!v.thicknessMap,se=!!v.gradientMap,Q=!!v.alphaMap,le=v.alphaTest>0,he=!!v.alphaHash,te=!!v.extensions,Ae=ln;v.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(Ae=e.toneMapping);let Me={shaderID:j,shaderType:v.type,shaderName:v.name,vertexShader:ze,fragmentShader:$e,defines:v.defines,customVertexShaderID:We,customFragmentShaderID:q,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:d,batching:_e,batchingColor:_e&&D._colorsTexture!==null,instancing:Ue,instancingColor:Ue&&D.instanceColor!==null,instancingMorph:Ue&&D.morphTexture!==null,outputColorSpace:J===null?e.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:ct.workingColorSpace,alphaToCoverage:!!v.alphaToCoverage,map:Be,matcap:Mt,envMap:Ie,envMapMode:Ie&&X.mapping,envMapCubeUVHeight:$,aoMap:Xe,lightMap:nt,bumpMap:Oe,normalMap:lt,displacementMap:At,emissiveMap:Bt,normalMapObjectSpace:lt&&v.normalMapType===_f,normalMapTangentSpace:lt&&v.normalMapType===ns,packedNormalMap:lt&&v.normalMapType===ns&&K_(v.normalMap.format),metalnessMap:ut,roughnessMap:_t,anisotropy:O,anisotropyMap:Y,clearcoat:Dt,clearcoatMap:re,clearcoatNormalMap:oe,clearcoatRoughnessMap:K,dispersion:Ze,retroreflection:C,iridescence:x,iridescenceMap:ee,iridescenceThicknessMap:ie,sheen:B,sheenColorMap:be,sheenRoughnessMap:fe,specularMap:ae,specularColorMap:we,specularIntensityMap:Re,transmission:V,transmissionMap:Le,thicknessMap:N,gradientMap:se,opaque:v.transparent===!1&&v.blending===so&&v.alphaToCoverage===!1,alphaMap:Q,alphaTest:le,alphaHash:he,combine:v.combine,mapUv:Be&&_(v.map.channel),aoMapUv:Xe&&_(v.aoMap.channel),lightMapUv:nt&&_(v.lightMap.channel),bumpMapUv:Oe&&_(v.bumpMap.channel),normalMapUv:lt&&_(v.normalMap.channel),displacementMapUv:At&&_(v.displacementMap.channel),emissiveMapUv:Bt&&_(v.emissiveMap.channel),metalnessMapUv:ut&&_(v.metalnessMap.channel),roughnessMapUv:_t&&_(v.roughnessMap.channel),anisotropyMapUv:Y&&_(v.anisotropyMap.channel),clearcoatMapUv:re&&_(v.clearcoatMap.channel),clearcoatNormalMapUv:oe&&_(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:K&&_(v.clearcoatRoughnessMap.channel),iridescenceMapUv:ee&&_(v.iridescenceMap.channel),iridescenceThicknessMapUv:ie&&_(v.iridescenceThicknessMap.channel),sheenColorMapUv:be&&_(v.sheenColorMap.channel),sheenRoughnessMapUv:fe&&_(v.sheenRoughnessMap.channel),specularMapUv:ae&&_(v.specularMap.channel),specularColorMapUv:we&&_(v.specularColorMap.channel),specularIntensityMapUv:Re&&_(v.specularIntensityMap.channel),transmissionMapUv:Le&&_(v.transmissionMap.channel),thicknessMapUv:N&&_(v.thicknessMap.channel),alphaMapUv:Q&&_(v.alphaMap.channel),vertexTangents:!!H.attributes.tangent&&(lt||O),vertexNormals:!!H.attributes.normal,vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,pointsUvs:D.isPoints===!0&&!!H.attributes.uv&&(Be||Q),fog:!!L,useFog:v.fog===!0,fogExp2:!!L&&L.isFogExp2,flatShading:v.wireframe===!1&&(v.flatShading===!0||H.attributes.normal===void 0&&lt===!1&&(v.isMeshLambertMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isMeshPhysicalMaterial)),sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:xe,skinning:D.isSkinnedMesh===!0,hasPositionAttribute:H.attributes.position!==void 0,morphTargets:H.morphAttributes.position!==void 0,morphNormals:H.morphAttributes.normal!==void 0,morphColors:H.morphAttributes.color!==void 0,morphTargetsCount:ge,morphTextureStride:Ee,numSunLights:w.sun.length,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numSunLightShadows:w.sunShadowMap.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numLightProbeGrids:I.length,numClippingPlanes:i.numPlanes,numClipIntersection:i.numIntersection,dithering:v.dithering,shadowMapEnabled:e.shadowMap.enabled&&y.length>0,shadowMapType:e.shadowMap.type,toneMapping:Ae,decodeVideoTexture:Be&&v.map.isVideoTexture===!0&&ct.getTransfer(v.map.colorSpace)===tt,decodeVideoTextureEmissive:Bt&&v.emissiveMap.isVideoTexture===!0&&ct.getTransfer(v.emissiveMap.colorSpace)===tt,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===qt,flipSided:v.side===kt,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:te&&v.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(te&&v.extensions.multiDraw===!0||_e)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return Me.vertexUv1s=l.has(1),Me.vertexUv2s=l.has(2),Me.vertexUv3s=l.has(3),l.clear(),Me}function m(v){let w=[];if(v.shaderID?w.push(v.shaderID):(w.push(v.customVertexShaderID),w.push(v.customFragmentShaderID)),v.defines!==void 0)for(let y in v.defines)w.push(y),w.push(v.defines[y]);return v.isRawShaderMaterial===!1&&(p(w,v),S(w,v),w.push(e.outputColorSpace)),w.push(v.customProgramCacheKey),w.join()}function p(v,w){v.push(w.precision),v.push(w.outputColorSpace),v.push(w.envMapMode),v.push(w.envMapCubeUVHeight),v.push(w.mapUv),v.push(w.alphaMapUv),v.push(w.lightMapUv),v.push(w.aoMapUv),v.push(w.bumpMapUv),v.push(w.normalMapUv),v.push(w.displacementMapUv),v.push(w.emissiveMapUv),v.push(w.metalnessMapUv),v.push(w.roughnessMapUv),v.push(w.anisotropyMapUv),v.push(w.clearcoatMapUv),v.push(w.clearcoatNormalMapUv),v.push(w.clearcoatRoughnessMapUv),v.push(w.iridescenceMapUv),v.push(w.iridescenceThicknessMapUv),v.push(w.sheenColorMapUv),v.push(w.sheenRoughnessMapUv),v.push(w.specularMapUv),v.push(w.specularColorMapUv),v.push(w.specularIntensityMapUv),v.push(w.transmissionMapUv),v.push(w.thicknessMapUv),v.push(w.combine),v.push(w.fogExp2),v.push(w.sizeAttenuation),v.push(w.morphTargetsCount),v.push(w.morphAttributeCount),v.push(w.numSunLights),v.push(w.numDirLights),v.push(w.numPointLights),v.push(w.numSpotLights),v.push(w.numSpotLightMaps),v.push(w.numHemiLights),v.push(w.numRectAreaLights),v.push(w.numSunLightShadows),v.push(w.numDirLightShadows),v.push(w.numPointLightShadows),v.push(w.numSpotLightShadows),v.push(w.numSpotLightShadowsWithMaps),v.push(w.numLightProbes),v.push(w.shadowMapType),v.push(w.toneMapping),v.push(w.numClippingPlanes),v.push(w.numClipIntersection),v.push(w.depthPacking)}function S(v,w){a.disableAll(),w.instancing&&a.enable(0),w.instancingColor&&a.enable(1),w.instancingMorph&&a.enable(2),w.matcap&&a.enable(3),w.envMap&&a.enable(4),w.normalMapObjectSpace&&a.enable(5),w.normalMapTangentSpace&&a.enable(6),w.clearcoat&&a.enable(7),w.iridescence&&a.enable(8),w.alphaTest&&a.enable(9),w.vertexColors&&a.enable(10),w.vertexAlphas&&a.enable(11),w.vertexUv1s&&a.enable(12),w.vertexUv2s&&a.enable(13),w.vertexUv3s&&a.enable(14),w.vertexTangents&&a.enable(15),w.anisotropy&&a.enable(16),w.alphaHash&&a.enable(17),w.batching&&a.enable(18),w.dispersion&&a.enable(19),w.retroreflection&&a.enable(24),w.batchingColor&&a.enable(20),w.gradientMap&&a.enable(21),w.packedNormalMap&&a.enable(22),w.vertexNormals&&a.enable(23),v.push(a.mask),a.disableAll(),w.fog&&a.enable(0),w.useFog&&a.enable(1),w.flatShading&&a.enable(2),w.logarithmicDepthBuffer&&a.enable(3),w.reversedDepthBuffer&&a.enable(4),w.skinning&&a.enable(5),w.morphTargets&&a.enable(6),w.morphNormals&&a.enable(7),w.morphColors&&a.enable(8),w.premultipliedAlpha&&a.enable(9),w.shadowMapEnabled&&a.enable(10),w.doubleSided&&a.enable(11),w.flipSided&&a.enable(12),w.useDepthPacking&&a.enable(13),w.dithering&&a.enable(14),w.transmission&&a.enable(15),w.sheen&&a.enable(16),w.opaque&&a.enable(17),w.pointsUvs&&a.enable(18),w.decodeVideoTexture&&a.enable(19),w.decodeVideoTextureEmissive&&a.enable(20),w.alphaToCoverage&&a.enable(21),w.numLightProbeGrids>0&&a.enable(22),w.hasPositionAttribute&&a.enable(23),v.push(a.mask)}function M(v){let w=h[v.type],y;if(w){let P=Jt[w];y=Bf.clone(P.uniforms)}else y=v.uniforms;return y}function g(v,w){let y=f.get(w);return y!==void 0?++y.usedTimes:(y=new $_(e,w,v,o),c.push(y),f.set(w,y)),y}function E(v){if(--v.usedTimes===0){let w=c.indexOf(v);c[w]=c[c.length-1],c.pop(),f.delete(v.cacheKey),v.destroy()}}function b(v){s.remove(v)}function R(){s.dispose()}return{getParameters:T,getProgramCacheKey:m,getUniforms:M,acquireProgram:g,releaseProgram:E,releaseShaderCache:b,programs:c,dispose:R}}function Z_(){let e=new WeakMap;function n(a){return e.has(a)}function t(a){let s=e.get(a);return s===void 0&&(s={},e.set(a,s)),s}function r(a){e.delete(a)}function o(a,s,l){e.get(a)[s]=l}function i(){e=new WeakMap}return{has:n,get:t,remove:r,update:o,dispose:i}}function j_(e,n){return e.groupOrder!==n.groupOrder?e.groupOrder-n.groupOrder:e.renderOrder!==n.renderOrder?e.renderOrder-n.renderOrder:e.material.id!==n.material.id?e.material.id-n.material.id:e.materialVariant!==n.materialVariant?e.materialVariant-n.materialVariant:e.z!==n.z?e.z-n.z:e.id-n.id}function gu(e,n){return e.groupOrder!==n.groupOrder?e.groupOrder-n.groupOrder:e.renderOrder!==n.renderOrder?e.renderOrder-n.renderOrder:e.z!==n.z?n.z-e.z:e.id-n.id}function _u(){let e=[],n=0,t=[],r=[],o=[];function i(){n=0,t.length=0,r.length=0,o.length=0}function a(d){let h=0;return d.isInstancedMesh&&(h+=2),d.isSkinnedMesh&&(h+=1),h}function s(d,h,_,T,m,p){let S=e[n];return S===void 0?(S={id:d.id,object:d,geometry:h,material:_,materialVariant:a(d),groupOrder:T,renderOrder:d.renderOrder,z:m,group:p},e[n]=S):(S.id=d.id,S.object=d,S.geometry=h,S.material=_,S.materialVariant=a(d),S.groupOrder=T,S.renderOrder=d.renderOrder,S.z=m,S.group=p),n++,S}function l(d,h,_,T,m,p,S){S.reversedDepth===!0&&(m=-m);let M=s(d,h,_,T,m,p);_.transmission>0?r.push(M):_.transparent===!0?o.push(M):t.push(M)}function c(d,h,_,T,m,p){let S=s(d,h,_,T,m,p);_.transmission>0?r.unshift(S):_.transparent===!0?o.unshift(S):t.unshift(S)}function f(d,h){t.length>1&&t.sort(d||j_),r.length>1&&r.sort(h||gu),o.length>1&&o.sort(h||gu)}function u(){for(let d=n,h=e.length;d<h;d++){let _=e[d];if(_.id===null)break;_.id=null,_.object=null,_.geometry=null,_.material=null,_.group=null}}return{opaque:t,transmissive:r,transparent:o,init:i,push:l,unshift:c,finish:u,sort:f}}function Q_(){let e=new WeakMap;function n(r,o){let i=e.get(r),a;return i===void 0?(a=new _u,e.set(r,[a])):o>=i.length?(a=new _u,i.push(a)):a=i[o],a}function t(){e=new WeakMap}return{get:n,dispose:t}}function J_(){let e={};return{get:function(n){if(e[n.id]!==void 0)return e[n.id];let t;switch(n.type){case"SunLight":case"DirectionalLight":t={direction:new ne,color:new ye};break;case"SpotLight":t={position:new ne,direction:new ne,color:new ye,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new ne,color:new ye,distance:0,decay:0};break;case"HemisphereLight":t={direction:new ne,skyColor:new ye,groundColor:new ye};break;case"RectAreaLight":t={color:new ye,position:new ne,halfWidth:new ne,halfHeight:new ne};break}return e[n.id]=t,t}}}function ev(){let e={};return{get:function(n){if(e[n.id]!==void 0)return e[n.id];let t;switch(n.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[n.id]=t,t}}}var tv=0;function nv(e,n){return(n.castShadow?2:0)-(e.castShadow?2:0)+(n.map?1:0)-(e.map?1:0)}function rv(e){let n=new J_,t=ev(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)r.probe.push(new ne);let o=new ne,i=new $t,a=new $t;function s(c){let f=0,u=0,d=0;for(let D=0;D<9;D++)r.probe[D].set(0,0,0);let h=0,_=0,T=0,m=0,p=0,S=0,M=0,g=0,E=0,b=0,R=0,v=0,w=0,y=0;c.sort(nv);for(let D=0,I=c.length;D<I;D++){let L=c[D],H=L.color,z=L.intensity,F=L.distance,X=null;if(L.shadow&&L.shadow.map&&(L.shadow.map.texture.format===tr?X=L.shadow.map.texture:X=L.shadow.map.depthTexture||L.shadow.map.texture),L.isAmbientLight)f+=H.r*z,u+=H.g*z,d+=H.b*z;else if(L.isLightProbe){for(let $=0;$<9;$++)r.probe[$].addScaledVector(L.sh.coefficients[$],z);y++}else if(L.isSunLight){let $=n.get(L);if($.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let j=L.shadow,Z=t.get(L);Z.shadowIntensity=j.intensity,Z.shadowBias=j.bias,Z.shadowNormalBias=j.normalBias,Z.shadowRadius=j.radius,Z.shadowMapSize.copy(j.mapSize).multiply(j.getFrameExtents()),r.sunShadow[_]=Z,r.sunShadowMap[_]=X;let ge=j.getViewportCount();for(let Ee=0;Ee<ge;Ee++)r.sunShadowMatrix[T+Ee]=j.getMatrix(Ee),r.sunShadowCascade[T+Ee]=j._cascadeData[Ee];T+=ge,_++}r.sun[h]=$,h++}else if(L.isDirectionalLight){let $=n.get(L);if($.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let j=L.shadow,Z=t.get(L);Z.shadowIntensity=j.intensity,Z.shadowBias=j.bias,Z.shadowNormalBias=j.normalBias,Z.shadowRadius=j.radius,Z.shadowMapSize=j.mapSize,r.directionalShadow[m]=Z,r.directionalShadowMap[m]=X,r.directionalShadowMatrix[m]=L.shadow.matrix,E++}r.directional[m]=$,m++}else if(L.isSpotLight){let $=n.get(L);$.position.setFromMatrixPosition(L.matrixWorld),$.color.copy(H).multiplyScalar(z),$.distance=F,$.coneCos=Math.cos(L.angle),$.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),$.decay=L.decay,r.spot[S]=$;let j=L.shadow;if(L.map&&(r.spotLightMap[v]=L.map,v++,j.updateMatrices(L),L.castShadow&&w++),r.spotLightMatrix[S]=j.matrix,L.castShadow){let Z=t.get(L);Z.shadowIntensity=j.intensity,Z.shadowBias=j.bias,Z.shadowNormalBias=j.normalBias,Z.shadowRadius=j.radius,Z.shadowMapSize=j.mapSize,r.spotShadow[S]=Z,r.spotShadowMap[S]=X,R++}S++}else if(L.isRectAreaLight){let $=n.get(L);$.color.copy(H).multiplyScalar(z),$.halfWidth.set(L.width*.5,0,0),$.halfHeight.set(0,L.height*.5,0),r.rectArea[M]=$,M++}else if(L.isPointLight){let $=n.get(L);if($.color.copy(L.color).multiplyScalar(L.intensity),$.distance=L.distance,$.decay=L.decay,L.castShadow){let j=L.shadow,Z=t.get(L);Z.shadowIntensity=j.intensity,Z.shadowBias=j.bias,Z.shadowNormalBias=j.normalBias,Z.shadowRadius=j.radius,Z.shadowMapSize=j.mapSize,Z.shadowCameraNear=j.camera.near,Z.shadowCameraFar=j.camera.far,r.pointShadow[p]=Z,r.pointShadowMap[p]=X,r.pointShadowMatrix[p]=L.shadow.matrix,b++}r.point[p]=$,p++}else if(L.isHemisphereLight){let $=n.get(L);$.skyColor.copy(L.color).multiplyScalar(z),$.groundColor.copy(L.groundColor).multiplyScalar(z),r.hemi[g]=$,g++}}M>0&&(e.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=ce.LTC_FLOAT_1,r.rectAreaLTC2=ce.LTC_FLOAT_2):(r.rectAreaLTC1=ce.LTC_HALF_1,r.rectAreaLTC2=ce.LTC_HALF_2)),r.ambient[0]=f,r.ambient[1]=u,r.ambient[2]=d;let P=r.hash;(P.sunLength!==h||P.directionalLength!==m||P.pointLength!==p||P.spotLength!==S||P.rectAreaLength!==M||P.hemiLength!==g||P.numSunShadows!==_||P.numDirectionalShadows!==E||P.numPointShadows!==b||P.numSpotShadows!==R||P.numSpotMaps!==v||P.numLightProbes!==y)&&(r.sun.length=h,r.directional.length=m,r.spot.length=S,r.rectArea.length=M,r.point.length=p,r.hemi.length=g,r.sunShadow.length=_,r.sunShadowMap.length=_,r.sunShadowMatrix.length=T,r.sunShadowCascade.length=T,r.directionalShadow.length=E,r.directionalShadowMap.length=E,r.directionalShadowMatrix.length=E,r.pointShadow.length=b,r.pointShadowMap.length=b,r.pointShadowMatrix.length=b,r.spotShadow.length=R,r.spotShadowMap.length=R,r.spotLightMatrix.length=R+v-w,r.spotLightMap.length=v,r.numSpotLightShadowsWithMaps=w,r.numLightProbes=y,P.sunLength=h,P.directionalLength=m,P.pointLength=p,P.spotLength=S,P.rectAreaLength=M,P.hemiLength=g,P.numSunShadows=_,P.numDirectionalShadows=E,P.numPointShadows=b,P.numSpotShadows=R,P.numSpotMaps=v,P.numLightProbes=y,r.version=tv++)}function l(c,f){let u=0,d=0,h=0,_=0,T=0,m=0,p=f.matrixWorldInverse;for(let S=0,M=c.length;S<M;S++){let g=c[S];if(g.isSunLight){let E=r.sun[u];E.direction.setFromMatrixPosition(g.matrixWorld),E.direction.transformDirection(p),u++}else if(g.isDirectionalLight){let E=r.directional[d];E.direction.setFromMatrixPosition(g.matrixWorld),o.setFromMatrixPosition(g.target.matrixWorld),E.direction.sub(o),E.direction.transformDirection(p),d++}else if(g.isSpotLight){let E=r.spot[_];E.position.setFromMatrixPosition(g.matrixWorld),E.position.applyMatrix4(p),E.direction.setFromMatrixPosition(g.matrixWorld),o.setFromMatrixPosition(g.target.matrixWorld),E.direction.sub(o),E.direction.transformDirection(p),_++}else if(g.isRectAreaLight){let E=r.rectArea[T];E.position.setFromMatrixPosition(g.matrixWorld),E.position.applyMatrix4(p),a.identity(),i.copy(g.matrixWorld),i.premultiply(p),a.extractRotation(i),E.halfWidth.set(g.width*.5,0,0),E.halfHeight.set(0,g.height*.5,0),E.halfWidth.applyMatrix4(a),E.halfHeight.applyMatrix4(a),T++}else if(g.isPointLight){let E=r.point[h];E.position.setFromMatrixPosition(g.matrixWorld),E.position.applyMatrix4(p),h++}else if(g.isHemisphereLight){let E=r.hemi[m];E.direction.setFromMatrixPosition(g.matrixWorld),E.direction.transformDirection(p),m++}}}return{setup:s,setupView:l,state:r}}function vu(e){let n=new rv(e),t=[],r=[],o=[];function i(d){u.camera=d,t.length=0,r.length=0,o.length=0}function a(d){t.push(d)}function s(d){r.push(d)}function l(d){o.push(d)}function c(){n.setup(t)}function f(d){n.setupView(t,d)}let u={lightsArray:t,shadowsArray:r,lightProbeGridArray:o,camera:null,lights:n,transmissionRenderTarget:{},textureUnits:0};return{init:i,state:u,setupLights:c,setupLightsView:f,pushLight:a,pushShadow:s,pushLightProbeGrid:l}}function ov(e){let n=new WeakMap;function t(o,i=0){let a=n.get(o),s;return a===void 0?(s=new vu(e),n.set(o,[s])):i>=a.length?(s=new vu(e),a.push(s)):s=a[i],s}function r(){n=new WeakMap}return{get:t,dispose:r}}var iv=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,av=`uniform sampler2D shadow_pass;
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
}`,sv=[new ne(1,0,0),new ne(-1,0,0),new ne(0,1,0),new ne(0,-1,0),new ne(0,0,1),new ne(0,0,-1)],lv=[new ne(0,-1,0),new ne(0,-1,0),new ne(0,0,1),new ne(0,0,-1),new ne(0,-1,0),new ne(0,-1,0)],Su=new $t,vo=new ne,Ps=new ne;function cv(e,n,t){let r=new ds,o=new je,i=new je,a=new Ft,s=new kf,l=new Vf,c={},f=t.maxTextureSize,u={[Rr]:kt,[kt]:Rr,[qt]:qt},d=new Qt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new je},radius:{value:4}},vertexShader:iv,fragmentShader:av}),h=d.clone();h.defines.HORIZONTAL_PASS=1;let _=new xt;_.setAttribute("position",new Ge(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let T=new Rt(_,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ao;let p=this.type;this.render=function(b,R,v){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||b.length===0)return;this.type===Lc&&(qe("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=ao);let w=e.getRenderTarget(),y=e.getActiveCubeFace(),P=e.getActiveMipmapLevel(),D=e.state;D.setBlending(vn),D.buffers.depth.getReversed()===!0?D.buffers.color.setClear(0,0,0,0):D.buffers.color.setClear(1,1,1,1),D.buffers.depth.setTest(!0),D.setScissorTest(!1);let I=p!==this.type;I&&R.traverse(function(L){L.material&&(Array.isArray(L.material)?L.material.forEach(H=>H.needsUpdate=!0):L.material.needsUpdate=!0)});for(let L=0,H=b.length;L<H;L++){let z=b[L],F=z.shadow;if(F===void 0){qe("WebGLShadowMap:",z,"has no shadow.");continue}if(F.autoUpdate===!1&&F.needsUpdate===!1)continue;o.copy(F.mapSize);let X=F.getFrameExtents();o.multiply(X),i.copy(F.mapSize),(o.x>f||o.y>f)&&(o.x>f&&(i.x=Math.floor(f/X.x),o.x=i.x*X.x,F.mapSize.x=i.x),o.y>f&&(i.y=Math.floor(f/X.y),o.y=i.y*X.y,F.mapSize.y=i.y));let $=e.state.buffers.depth.getReversed();if(F.camera._reversedDepth=$,F.map===null||I===!0){if(F.map!==null&&(F.map.depthTexture!==null&&(F.map.depthTexture.dispose(),F.map.depthTexture=null),F.map.dispose()),this.type===Ar){if(z.isPointLight){qe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}F.map=new jt(o.x,o.y,{format:tr,type:Sn,minFilter:St,magFilter:St,generateMipmaps:!1}),F.map.texture.name=z.name+".shadowMap",F.map.depthTexture=new ho(o.x,o.y,yn),F.map.depthTexture.name=z.name+".shadowMapDepth",F.map.depthTexture.format=Jn,F.map.depthTexture.compareFunction=null,F.map.depthTexture.minFilter=Fn,F.map.depthTexture.magFilter=Fn}else z.isPointLight?(F.map=new pi(o.x),F.map.depthTexture=new Hf(o.x,Hn)):(F.map=new jt(o.x,o.y),F.map.depthTexture=new ho(o.x,o.y,Hn)),F.map.depthTexture.name=z.name+".shadowMap",F.map.depthTexture.format=Jn,this.type===ao?(F.map.depthTexture.compareFunction=$?ii:oi,F.map.depthTexture.minFilter=St,F.map.depthTexture.magFilter=St):(F.map.depthTexture.compareFunction=null,F.map.depthTexture.minFilter=Fn,F.map.depthTexture.magFilter=Fn);F.camera.updateProjectionMatrix()}F.map.isWebGLCubeRenderTarget!==!0&&(F.map.width!==o.x||F.map.height!==o.y)&&F.map.setSize(o.x,o.y);let j=F.map.isWebGLCubeRenderTarget?6:F.getViewportCount();z.isPointLight!==!0&&F.updateMatrices(z,v);for(let Z=0;Z<j;Z++){let ge=F.getCamera(Z);if(z.isPointLight){let Ee=F.camera,ze=F.matrix,$e=z.distance||Ee.far;$e!==Ee.far&&(Ee.far=$e,Ee.updateProjectionMatrix()),vo.setFromMatrixPosition(z.matrixWorld),Ee.position.copy(vo),Ps.copy(Ee.position),Ps.add(sv[Z]),Ee.up.copy(lv[Z]),Ee.lookAt(Ps),Ee.updateMatrixWorld(),ze.makeTranslation(-vo.x,-vo.y,-vo.z),Su.multiplyMatrices(Ee.projectionMatrix,Ee.matrixWorldInverse),F._frustum.setFromProjectionMatrix(Su,Ee.coordinateSystem,Ee.reversedDepth)}if(F.map.isWebGLCubeRenderTarget)e.setRenderTarget(F.map,Z),e.clear();else{Z===0&&(e.setRenderTarget(F.map),e.clear());let Ee=F.getViewport(Z);a.set(i.x*Ee.x,i.y*Ee.y,i.x*Ee.z,i.y*Ee.w),D.viewport(a)}r=F.getFrustum(Z),g(R,v,ge,z,this.type)}F.isPointLightShadow!==!0&&this.type===Ar&&S(F,v),F.needsUpdate=!1}p=this.type,m.needsUpdate=!1,e.setRenderTarget(w,y,P)};function S(b,R){let v=n.update(T);d.defines.VSM_SAMPLES!==b.blurSamples&&(d.defines.VSM_SAMPLES=b.blurSamples,h.defines.VSM_SAMPLES=b.blurSamples,d.needsUpdate=!0,h.needsUpdate=!0),b.mapPass===null?b.mapPass=new jt(o.x,o.y,{format:tr,type:Sn}):(b.mapPass.width!==b.map.width||b.mapPass.height!==b.map.height)&&b.mapPass.setSize(b.map.width,b.map.height),d.uniforms.shadow_pass.value=b.map.depthTexture,d.uniforms.resolution.value.set(b.map.width,b.map.height),d.uniforms.radius.value=b.radius,e.setRenderTarget(b.mapPass),e.clear(),e.renderBufferDirect(R,null,v,d,T,null),h.uniforms.shadow_pass.value=b.mapPass.texture,h.uniforms.resolution.value.set(b.map.width,b.map.height),h.uniforms.radius.value=b.radius,e.setRenderTarget(b.map),e.clear(),e.renderBufferDirect(R,null,v,h,T,null)}function M(b,R,v,w){let y=null,P=v.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(P!==void 0)y=P;else if(y=v.isPointLight===!0?l:s,e.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){let D=y.uuid,I=R.uuid,L=c[D];L===void 0&&(L={},c[D]=L);let H=L[I];H===void 0&&(H=y.clone(),L[I]=H,R.addEventListener("dispose",E)),y=H}if(y.visible=R.visible,y.wireframe=R.wireframe,w===Ar?y.side=R.shadowSide!==null?R.shadowSide:R.side:y.side=R.shadowSide!==null?R.shadowSide:u[R.side],y.alphaMap=R.alphaMap,y.alphaTest=R.alphaToCoverage===!0?.5:R.alphaTest,y.map=R.map,y.clipShadows=R.clipShadows,y.clippingPlanes=R.clippingPlanes,y.clipIntersection=R.clipIntersection,y.displacementMap=R.displacementMap,y.displacementScale=R.displacementScale,y.displacementBias=R.displacementBias,y.wireframeLinewidth=R.wireframeLinewidth,y.linewidth=R.linewidth,v.isPointLight===!0&&y.isMeshDistanceMaterial===!0){let D=e.properties.get(y);D.light=v}return y}function g(b,R,v,w,y){if(b.visible===!1)return;if(b.layers.test(R.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&y===Ar)&&(!b.frustumCulled||b.intersectsFrustum(r))){b.modelViewMatrix.multiplyMatrices(v.matrixWorldInverse,b.matrixWorld);let I=n.update(b),L=b.material;if(Array.isArray(L)){let H=I.groups;for(let z=0,F=H.length;z<F;z++){let X=H[z],$=L[X.materialIndex];if($&&$.visible){let j=M(b,$,w,y);b.onBeforeShadow(e,b,R,v,I,j,X),e.renderBufferDirect(v,null,I,j,b,X),b.onAfterShadow(e,b,R,v,I,j,X)}}}else if(L.visible){let H=M(b,L,w,y);b.onBeforeShadow(e,b,R,v,I,H,null),e.renderBufferDirect(v,null,I,H,b,null),b.onAfterShadow(e,b,R,v,I,H,null)}}let D=b.children;for(let I=0,L=D.length;I<L;I++)g(D[I],R,v,w,y)}function E(b){b.target.removeEventListener("dispose",E);for(let v in c){let w=c[v],y=b.target.uuid;y in w&&(w[y].dispose(),delete w[y])}}}function fv(e,n){function t(){let N=!1,se=new Ft,Q=null,le=new Ft(0,0,0,0);return{setMask:function(he){Q!==he&&!N&&(e.colorMask(he,he,he,he),Q=he)},setLocked:function(he){N=he},setClear:function(he,te,Ae,Me,rt){rt===!0&&(he*=Me,te*=Me,Ae*=Me),se.set(he,te,Ae,Me),le.equals(se)===!1&&(e.clearColor(he,te,Ae,Me),le.copy(se))},reset:function(){N=!1,Q=null,le.set(-1,0,0,0)}}}function r(){let N=!1,se=!1,Q=null,le=null,he=null;return{setReversed:function(te){if(se!==te){let Ae=n.get("EXT_clip_control");te?Ae.clipControlEXT(Ae.LOWER_LEFT_EXT,Ae.ZERO_TO_ONE_EXT):Ae.clipControlEXT(Ae.LOWER_LEFT_EXT,Ae.NEGATIVE_ONE_TO_ONE_EXT),se=te;let Me=he;he=null,this.setClear(Me)}},getReversed:function(){return se},setTest:function(te){te?J(e.DEPTH_TEST):xe(e.DEPTH_TEST)},setMask:function(te){Q!==te&&!N&&(e.depthMask(te),Q=te)},setFunc:function(te){if(se&&(te=yf[te]),le!==te){switch(te){case Qc:e.depthFunc(e.NEVER);break;case Jc:e.depthFunc(e.ALWAYS);break;case ef:e.depthFunc(e.LESS);break;case da:e.depthFunc(e.LEQUAL);break;case tf:e.depthFunc(e.EQUAL);break;case nf:e.depthFunc(e.GEQUAL);break;case rf:e.depthFunc(e.GREATER);break;case of:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}le=te}},setLocked:function(te){N=te},setClear:function(te){he!==te&&(he=te,se&&(te=1-te),e.clearDepth(te))},reset:function(){N=!1,Q=null,le=null,he=null,se=!1}}}function o(){let N=!1,se=null,Q=null,le=null,he=null,te=null,Ae=null,Me=null,rt=null;return{setTest:function(Ye){N||(Ye?J(e.STENCIL_TEST):xe(e.STENCIL_TEST))},setMask:function(Ye){se!==Ye&&!N&&(e.stencilMask(Ye),se=Ye)},setFunc:function(Ye,sn,gn){(Q!==Ye||le!==sn||he!==gn)&&(e.stencilFunc(Ye,sn,gn),Q=Ye,le=sn,he=gn)},setOp:function(Ye,sn,gn){(te!==Ye||Ae!==sn||Me!==gn)&&(e.stencilOp(Ye,sn,gn),te=Ye,Ae=sn,Me=gn)},setLocked:function(Ye){N=Ye},setClear:function(Ye){rt!==Ye&&(e.clearStencil(Ye),rt=Ye)},reset:function(){N=!1,se=null,Q=null,le=null,he=null,te=null,Ae=null,Me=null,rt=null}}}let i=new t,a=new r,s=new o,l=new WeakMap,c=new WeakMap,f={},u={},d={},h=new WeakMap,_=[],T=null,m=!1,p=null,S=null,M=null,g=null,E=null,b=null,R=null,v=new ye(0,0,0),w=0,y=!1,P=null,D=null,I=null,L=null,H=null,z=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),F=!1,X=0,$=e.getParameter(e.VERSION);$.indexOf("WebGL")!==-1?(X=parseFloat(/^WebGL (\d)/.exec($)[1]),F=X>=1):$.indexOf("OpenGL ES")!==-1&&(X=parseFloat(/^OpenGL ES (\d)/.exec($)[1]),F=X>=2);let j=null,Z={},ge=e.getParameter(e.SCISSOR_BOX),Ee=e.getParameter(e.VIEWPORT),ze=new Ft().fromArray(ge),$e=new Ft().fromArray(Ee);function We(N,se,Q,le){let he=new Uint8Array(4),te=e.createTexture();e.bindTexture(N,te),e.texParameteri(N,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(N,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let Ae=0;Ae<Q;Ae++)N===e.TEXTURE_3D||N===e.TEXTURE_2D_ARRAY?e.texImage3D(se,0,e.RGBA,1,1,le,0,e.RGBA,e.UNSIGNED_BYTE,he):e.texImage2D(se+Ae,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,he);return te}let q={};q[e.TEXTURE_2D]=We(e.TEXTURE_2D,e.TEXTURE_2D,1),q[e.TEXTURE_CUBE_MAP]=We(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),q[e.TEXTURE_2D_ARRAY]=We(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),q[e.TEXTURE_3D]=We(e.TEXTURE_3D,e.TEXTURE_3D,1,1),i.setClear(0,0,0,1),a.setClear(1),s.setClear(0),J(e.DEPTH_TEST),a.setFunc(da),Oe(!1),lt(la),J(e.CULL_FACE),Xe(vn);function J(N){f[N]!==!0&&(e.enable(N),f[N]=!0)}function xe(N){f[N]!==!1&&(e.disable(N),f[N]=!1)}function Ue(N,se){return d[N]!==se?(e.bindFramebuffer(N,se),d[N]=se,N===e.DRAW_FRAMEBUFFER&&(d[e.FRAMEBUFFER]=se),N===e.FRAMEBUFFER&&(d[e.DRAW_FRAMEBUFFER]=se),!0):!1}function _e(N,se){let Q=_,le=!1;if(N){Q=h.get(se),Q===void 0&&(Q=[],h.set(se,Q));let he=N.textures;if(Q.length!==he.length||Q[0]!==e.COLOR_ATTACHMENT0){for(let te=0,Ae=he.length;te<Ae;te++)Q[te]=e.COLOR_ATTACHMENT0+te;Q.length=he.length,le=!0}}else Q[0]!==e.BACK&&(Q[0]=e.BACK,le=!0);le&&e.drawBuffers(Q)}function Be(N){return T!==N?(e.useProgram(N),T=N,!0):!1}let Mt={[yr]:e.FUNC_ADD,[Uc]:e.FUNC_SUBTRACT,[Ic]:e.FUNC_REVERSE_SUBTRACT};Mt[Nc]=e.MIN,Mt[Oc]=e.MAX;let Ie={[Fc]:e.ZERO,[Hc]:e.ONE,[Bc]:e.SRC_COLOR,[kc]:e.SRC_ALPHA,[Yc]:e.SRC_ALPHA_SATURATE,[Xc]:e.DST_COLOR,[zc]:e.DST_ALPHA,[Gc]:e.ONE_MINUS_SRC_COLOR,[Vc]:e.ONE_MINUS_SRC_ALPHA,[$c]:e.ONE_MINUS_DST_COLOR,[Wc]:e.ONE_MINUS_DST_ALPHA,[Kc]:e.CONSTANT_COLOR,[qc]:e.ONE_MINUS_CONSTANT_COLOR,[Zc]:e.CONSTANT_ALPHA,[jc]:e.ONE_MINUS_CONSTANT_ALPHA};function Xe(N,se,Q,le,he,te,Ae,Me,rt,Ye){if(N===vn){m===!0&&(xe(e.BLEND),m=!1);return}if(m===!1&&(J(e.BLEND),m=!0),N!==Dc){if(N!==p||Ye!==y){if((S!==yr||E!==yr)&&(e.blendEquation(e.FUNC_ADD),S=yr,E=yr),Ye)switch(N){case so:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case ca:e.blendFunc(e.ONE,e.ONE);break;case fa:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case ua:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:it("WebGLState: Invalid blending: ",N);break}else switch(N){case so:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case ca:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case fa:it("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case ua:it("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:it("WebGLState: Invalid blending: ",N);break}M=null,g=null,b=null,R=null,v.set(0,0,0),w=0,p=N,y=Ye}return}he=he||se,te=te||Q,Ae=Ae||le,(se!==S||he!==E)&&(e.blendEquationSeparate(Mt[se],Mt[he]),S=se,E=he),(Q!==M||le!==g||te!==b||Ae!==R)&&(e.blendFuncSeparate(Ie[Q],Ie[le],Ie[te],Ie[Ae]),M=Q,g=le,b=te,R=Ae),(Me.equals(v)===!1||rt!==w)&&(e.blendColor(Me.r,Me.g,Me.b,rt),v.copy(Me),w=rt),p=N,y=!1}function nt(N,se){N.side===qt?xe(e.CULL_FACE):J(e.CULL_FACE);let Q=N.side===kt;se&&(Q=!Q),Oe(Q),N.blending===so&&N.transparent===!1?Xe(vn):Xe(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),a.setFunc(N.depthFunc),a.setTest(N.depthTest),a.setMask(N.depthWrite),i.setMask(N.colorWrite);let le=N.stencilWrite;s.setTest(le),le&&(s.setMask(N.stencilWriteMask),s.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),s.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),Bt(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?J(e.SAMPLE_ALPHA_TO_COVERAGE):xe(e.SAMPLE_ALPHA_TO_COVERAGE)}function Oe(N){P!==N&&(N?e.frontFace(e.CW):e.frontFace(e.CCW),P=N)}function lt(N){N!==Cc?(J(e.CULL_FACE),N!==D&&(N===la?e.cullFace(e.BACK):N===Pc?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):xe(e.CULL_FACE),D=N}function At(N){N!==I&&(F&&e.lineWidth(N),I=N)}function Bt(N,se,Q){N?(J(e.POLYGON_OFFSET_FILL),(L!==se||H!==Q)&&(L=se,H=Q,a.getReversed()&&(se=-se),e.polygonOffset(se,Q))):xe(e.POLYGON_OFFSET_FILL)}function ut(N){N?J(e.SCISSOR_TEST):xe(e.SCISSOR_TEST)}function _t(N){N===void 0&&(N=e.TEXTURE0+z-1),j!==N&&(e.activeTexture(N),j=N)}function O(N,se,Q){Q===void 0&&(j===null?Q=e.TEXTURE0+z-1:Q=j);let le=Z[Q];le===void 0&&(le={type:void 0,texture:void 0},Z[Q]=le),(le.type!==N||le.texture!==se)&&(j!==Q&&(e.activeTexture(Q),j=Q),e.bindTexture(N,se||q[N]),le.type=N,le.texture=se)}function Dt(){let N=Z[j];N!==void 0&&N.type!==void 0&&(e.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function Ze(){try{e.compressedTexImage2D(...arguments)}catch(N){it("WebGLState:",N)}}function C(){try{e.compressedTexImage3D(...arguments)}catch(N){it("WebGLState:",N)}}function x(){try{e.texSubImage2D(...arguments)}catch(N){it("WebGLState:",N)}}function B(){try{e.texSubImage3D(...arguments)}catch(N){it("WebGLState:",N)}}function V(){try{e.compressedTexSubImage2D(...arguments)}catch(N){it("WebGLState:",N)}}function Y(){try{e.compressedTexSubImage3D(...arguments)}catch(N){it("WebGLState:",N)}}function re(){try{e.texStorage2D(...arguments)}catch(N){it("WebGLState:",N)}}function oe(){try{e.texStorage3D(...arguments)}catch(N){it("WebGLState:",N)}}function K(){try{e.texImage2D(...arguments)}catch(N){it("WebGLState:",N)}}function ee(){try{e.texImage3D(...arguments)}catch(N){it("WebGLState:",N)}}function ie(N){return u[N]!==void 0?u[N]:e.getParameter(N)}function be(N,se){u[N]!==se&&(e.pixelStorei(N,se),u[N]=se)}function fe(N){ze.equals(N)===!1&&(e.scissor(N.x,N.y,N.z,N.w),ze.copy(N))}function ae(N){$e.equals(N)===!1&&(e.viewport(N.x,N.y,N.z,N.w),$e.copy(N))}function we(N,se){let Q=c.get(se);Q===void 0&&(Q=new WeakMap,c.set(se,Q));let le=Q.get(N);le===void 0&&(le=e.getUniformBlockIndex(se,N.name),Q.set(N,le))}function Re(N,se){let le=c.get(se).get(N);l.get(se)!==le&&(e.uniformBlockBinding(se,le,N.__bindingPointIndex),l.set(se,le))}function Le(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),a.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),f={},u={},j=null,Z={},d={},h=new WeakMap,_=[],T=null,m=!1,p=null,S=null,M=null,g=null,E=null,b=null,R=null,v=new ye(0,0,0),w=0,y=!1,P=null,D=null,I=null,L=null,H=null,ze.set(0,0,e.canvas.width,e.canvas.height),$e.set(0,0,e.canvas.width,e.canvas.height),i.reset(),a.reset(),s.reset()}return{buffers:{color:i,depth:a,stencil:s},enable:J,disable:xe,bindFramebuffer:Ue,drawBuffers:_e,useProgram:Be,setBlending:Xe,setMaterial:nt,setFlipSided:Oe,setCullFace:lt,setLineWidth:At,setPolygonOffset:Bt,setScissorTest:ut,activeTexture:_t,bindTexture:O,unbindTexture:Dt,compressedTexImage2D:Ze,compressedTexImage3D:C,texImage2D:K,texImage3D:ee,pixelStorei:be,getParameter:ie,updateUBOMapping:we,uniformBlockBinding:Re,texStorage2D:re,texStorage3D:oe,texSubImage2D:x,texSubImage3D:B,compressedTexSubImage2D:V,compressedTexSubImage3D:Y,scissor:fe,viewport:ae,reset:Le}}function uv(e,n,t,r,o,i,a){let s=n.has("WEBGL_multisampled_render_to_texture")?n.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new je,f=new WeakMap,u=new Set,d,h=new WeakMap,_=!1;try{_=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function T(C,x){return _?new OffscreenCanvas(C,x):bf("canvas")}function m(C,x,B){let V=1,Y=Ze(C);if((Y.width>B||Y.height>B)&&(V=B/Math.max(Y.width,Y.height)),V<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){let re=Math.floor(V*Y.width),oe=Math.floor(V*Y.height);d===void 0&&(d=T(re,oe));let K=x?T(re,oe):d;return K.width=re,K.height=oe,K.getContext("2d").drawImage(C,0,0,re,oe),qe("WebGLRenderer: Texture has been resized from ("+Y.width+"x"+Y.height+") to ("+re+"x"+oe+")."),K}else return"data"in C&&qe("WebGLRenderer: Image in DataTexture is too big ("+Y.width+"x"+Y.height+")."),C;return C}function p(C){return C.generateMipmaps}function S(C){e.generateMipmap(C)}function M(C){return C.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?e.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function g(C,x,B,V,Y,re=!1){if(C!==null){if(e[C]!==void 0)return e[C];qe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let oe;V&&(oe=n.get("EXT_texture_norm16"),oe||qe("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let K=x;if(x===e.RED&&(B===e.FLOAT&&(K=e.R32F),B===e.HALF_FLOAT&&(K=e.R16F),B===e.UNSIGNED_BYTE&&(K=e.R8),B===e.UNSIGNED_SHORT&&oe&&(K=oe.R16_EXT),B===e.SHORT&&oe&&(K=oe.R16_SNORM_EXT)),x===e.RED_INTEGER&&(B===e.UNSIGNED_BYTE&&(K=e.R8UI),B===e.UNSIGNED_SHORT&&(K=e.R16UI),B===e.UNSIGNED_INT&&(K=e.R32UI),B===e.BYTE&&(K=e.R8I),B===e.SHORT&&(K=e.R16I),B===e.INT&&(K=e.R32I)),x===e.RG&&(B===e.FLOAT&&(K=e.RG32F),B===e.HALF_FLOAT&&(K=e.RG16F),B===e.UNSIGNED_BYTE&&(K=e.RG8),B===e.UNSIGNED_SHORT&&oe&&(K=oe.RG16_EXT),B===e.SHORT&&oe&&(K=oe.RG16_SNORM_EXT)),x===e.RG_INTEGER&&(B===e.UNSIGNED_BYTE&&(K=e.RG8UI),B===e.UNSIGNED_SHORT&&(K=e.RG16UI),B===e.UNSIGNED_INT&&(K=e.RG32UI),B===e.BYTE&&(K=e.RG8I),B===e.SHORT&&(K=e.RG16I),B===e.INT&&(K=e.RG32I)),x===e.RGB_INTEGER&&(B===e.UNSIGNED_BYTE&&(K=e.RGB8UI),B===e.UNSIGNED_SHORT&&(K=e.RGB16UI),B===e.UNSIGNED_INT&&(K=e.RGB32UI),B===e.BYTE&&(K=e.RGB8I),B===e.SHORT&&(K=e.RGB16I),B===e.INT&&(K=e.RGB32I)),x===e.RGBA_INTEGER&&(B===e.UNSIGNED_BYTE&&(K=e.RGBA8UI),B===e.UNSIGNED_SHORT&&(K=e.RGBA16UI),B===e.UNSIGNED_INT&&(K=e.RGBA32UI),B===e.BYTE&&(K=e.RGBA8I),B===e.SHORT&&(K=e.RGBA16I),B===e.INT&&(K=e.RGBA32I)),x===e.RGB&&(B===e.UNSIGNED_SHORT&&oe&&(K=oe.RGB16_EXT),B===e.SHORT&&oe&&(K=oe.RGB16_SNORM_EXT),B===e.UNSIGNED_INT_5_9_9_9_REV&&(K=e.RGB9_E5),B===e.UNSIGNED_INT_10F_11F_11F_REV&&(K=e.R11F_G11F_B10F)),x===e.RGBA){let ee=re?os:ct.getTransfer(Y);B===e.FLOAT&&(K=e.RGBA32F),B===e.HALF_FLOAT&&(K=e.RGBA16F),B===e.UNSIGNED_BYTE&&(K=ee===tt?e.SRGB8_ALPHA8:e.RGBA8),B===e.UNSIGNED_SHORT&&oe&&(K=oe.RGBA16_EXT),B===e.SHORT&&oe&&(K=oe.RGBA16_SNORM_EXT),B===e.UNSIGNED_SHORT_4_4_4_4&&(K=e.RGBA4),B===e.UNSIGNED_SHORT_5_5_5_1&&(K=e.RGB5_A1)}return(K===e.R16F||K===e.R32F||K===e.RG16F||K===e.RG32F||K===e.RGBA16F||K===e.RGBA32F)&&n.get("EXT_color_buffer_float"),K}function E(C,x){let B;return C?x===null||x===Hn||x===Pr?B=e.DEPTH24_STENCIL8:x===yn?B=e.DEPTH32F_STENCIL8:x===fo&&(B=e.DEPTH24_STENCIL8,qe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===Hn||x===Pr?B=e.DEPTH_COMPONENT24:x===yn?B=e.DEPTH_COMPONENT32F:x===fo&&(B=e.DEPTH_COMPONENT16),B}function b(C,x){return p(C)===!0||C.isFramebufferTexture&&C.minFilter!==Fn&&C.minFilter!==St?Math.log2(Math.max(x.width,x.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?x.mipmaps.length:1}function R(C){let x=C.target;x.removeEventListener("dispose",R),w(x),x.isVideoTexture&&f.delete(x),x.isHTMLTexture&&u.delete(x)}function v(C){let x=C.target;x.removeEventListener("dispose",v),P(x)}function w(C){let x=r.get(C);if(x.__webglInit===void 0)return;let B=C.source,V=h.get(B);if(V){let Y=V[x.__cacheKey];Y.usedTimes--,Y.usedTimes===0&&y(C),Object.keys(V).length===0&&h.delete(B)}r.remove(C)}function y(C){let x=r.get(C);e.deleteTexture(x.__webglTexture);let B=C.source,V=h.get(B);delete V[x.__cacheKey],a.memory.textures--}function P(C){let x=r.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),r.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let V=0;V<6;V++){if(Array.isArray(x.__webglFramebuffer[V]))for(let Y=0;Y<x.__webglFramebuffer[V].length;Y++)e.deleteFramebuffer(x.__webglFramebuffer[V][Y]);else e.deleteFramebuffer(x.__webglFramebuffer[V]);x.__webglDepthbuffer&&e.deleteRenderbuffer(x.__webglDepthbuffer[V])}else{if(Array.isArray(x.__webglFramebuffer))for(let V=0;V<x.__webglFramebuffer.length;V++)e.deleteFramebuffer(x.__webglFramebuffer[V]);else e.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&e.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&e.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let V=0;V<x.__webglColorRenderbuffer.length;V++)x.__webglColorRenderbuffer[V]&&e.deleteRenderbuffer(x.__webglColorRenderbuffer[V]);x.__webglDepthRenderbuffer&&e.deleteRenderbuffer(x.__webglDepthRenderbuffer)}let B=C.textures;for(let V=0,Y=B.length;V<Y;V++){let re=r.get(B[V]);re.__webglTexture&&(e.deleteTexture(re.__webglTexture),a.memory.textures--),r.remove(B[V])}r.remove(C)}let D=0;function I(){D=0}function L(){return D}function H(C){D=C}function z(){let C=D;return C>=o.maxTextures&&qe("WebGLTextures: Trying to use "+(C+1)+" texture units while this GPU supports only "+o.maxTextures),D+=1,C}function F(C){let x=[];return x.push(C.wrapS),x.push(C.wrapT),x.push(C.wrapR||0),x.push(C.magFilter),x.push(C.minFilter),x.push(C.anisotropy),x.push(C.internalFormat),x.push(C.format),x.push(C.type),x.push(C.generateMipmaps),x.push(C.premultiplyAlpha),x.push(C.flipY),x.push(C.unpackAlignment),x.push(C.colorSpace),x.join()}function X(C,x){let B=r.get(C);if(C.isVideoTexture&&O(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&B.__version!==C.version){let V=C.image;if(V===null)qe("WebGLRenderer: Texture marked for update but no image data found.");else if(V.complete===!1)qe("WebGLRenderer: Texture marked for update but image is incomplete");else{xe(B,C,x);return}}else C.isExternalTexture&&(B.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(e.TEXTURE_2D,B.__webglTexture,e.TEXTURE0+x)}function $(C,x){let B=r.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&B.__version!==C.version){xe(B,C,x);return}else C.isExternalTexture&&(B.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(e.TEXTURE_2D_ARRAY,B.__webglTexture,e.TEXTURE0+x)}function j(C,x){let B=r.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&B.__version!==C.version){xe(B,C,x);return}t.bindTexture(e.TEXTURE_3D,B.__webglTexture,e.TEXTURE0+x)}function Z(C,x){let B=r.get(C);if(C.isCubeDepthTexture!==!0&&C.version>0&&B.__version!==C.version){Ue(B,C,x);return}t.bindTexture(e.TEXTURE_CUBE_MAP,B.__webglTexture,e.TEXTURE0+x)}let ge={[cn]:e.REPEAT,[qo]:e.CLAMP_TO_EDGE,[cf]:e.MIRRORED_REPEAT},Ee={[Fn]:e.NEAREST,[ff]:e.NEAREST_MIPMAP_NEAREST,[co]:e.NEAREST_MIPMAP_LINEAR,[St]:e.LINEAR,[Zo]:e.LINEAR_MIPMAP_NEAREST,[zt]:e.LINEAR_MIPMAP_LINEAR},ze={[vf]:e.NEVER,[Tf]:e.ALWAYS,[Sf]:e.LESS,[oi]:e.LEQUAL,[xf]:e.EQUAL,[ii]:e.GEQUAL,[Ef]:e.GREATER,[Mf]:e.NOTEQUAL};function $e(C,x){if(x.type===yn&&n.has("OES_texture_float_linear")===!1&&(x.magFilter===St||x.magFilter===Zo||x.magFilter===co||x.magFilter===zt||x.minFilter===St||x.minFilter===Zo||x.minFilter===co||x.minFilter===zt)&&qe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(C,e.TEXTURE_WRAP_S,ge[x.wrapS]),e.texParameteri(C,e.TEXTURE_WRAP_T,ge[x.wrapT]),(C===e.TEXTURE_3D||C===e.TEXTURE_2D_ARRAY)&&e.texParameteri(C,e.TEXTURE_WRAP_R,ge[x.wrapR]),e.texParameteri(C,e.TEXTURE_MAG_FILTER,Ee[x.magFilter]),e.texParameteri(C,e.TEXTURE_MIN_FILTER,Ee[x.minFilter]),x.compareFunction&&(e.texParameteri(C,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(C,e.TEXTURE_COMPARE_FUNC,ze[x.compareFunction])),n.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===Fn||x.minFilter!==co&&x.minFilter!==zt||x.type===yn&&n.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||r.get(x).__currentAnisotropy){let B=n.get("EXT_texture_filter_anisotropic");e.texParameterf(C,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,o.getMaxAnisotropy())),r.get(x).__currentAnisotropy=x.anisotropy}}}function We(C,x){let B=!1;C.__webglInit===void 0&&(C.__webglInit=!0,x.addEventListener("dispose",R));let V=x.source,Y=h.get(V);Y===void 0&&(Y={},h.set(V,Y));let re=F(x);if(re!==C.__cacheKey){Y[re]===void 0&&(Y[re]={texture:e.createTexture(),usedTimes:0},a.memory.textures++,B=!0),Y[re].usedTimes++;let oe=Y[C.__cacheKey];oe!==void 0&&(Y[C.__cacheKey].usedTimes--,oe.usedTimes===0&&y(x)),C.__cacheKey=re,C.__webglTexture=Y[re].texture}return B}function q(C,x,B){return Math.floor(Math.floor(C/B)/x)}function J(C,x,B,V){let re=C.updateRanges;if(re.length===0)t.texSubImage2D(e.TEXTURE_2D,0,0,0,x.width,x.height,B,V,x.data);else{re.sort((be,fe)=>be.start-fe.start);let oe=0;for(let be=1;be<re.length;be++){let fe=re[oe],ae=re[be],we=fe.start+fe.count,Re=q(ae.start,x.width,4),Le=q(fe.start,x.width,4);ae.start<=we+1&&Re===Le&&q(ae.start+ae.count-1,x.width,4)===Re?fe.count=Math.max(fe.count,ae.start+ae.count-fe.start):(++oe,re[oe]=ae)}re.length=oe+1;let K=t.getParameter(e.UNPACK_ROW_LENGTH),ee=t.getParameter(e.UNPACK_SKIP_PIXELS),ie=t.getParameter(e.UNPACK_SKIP_ROWS);t.pixelStorei(e.UNPACK_ROW_LENGTH,x.width);for(let be=0,fe=re.length;be<fe;be++){let ae=re[be],we=Math.floor(ae.start/4),Re=Math.ceil(ae.count/4),Le=we%x.width,N=Math.floor(we/x.width),se=Re,Q=1;t.pixelStorei(e.UNPACK_SKIP_PIXELS,Le),t.pixelStorei(e.UNPACK_SKIP_ROWS,N),t.texSubImage2D(e.TEXTURE_2D,0,Le,N,se,Q,B,V,x.data)}C.clearUpdateRanges(),t.pixelStorei(e.UNPACK_ROW_LENGTH,K),t.pixelStorei(e.UNPACK_SKIP_PIXELS,ee),t.pixelStorei(e.UNPACK_SKIP_ROWS,ie)}}function xe(C,x,B){let V=e.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(V=e.TEXTURE_2D_ARRAY),x.isData3DTexture&&(V=e.TEXTURE_3D);let Y=We(C,x),re=x.source;t.bindTexture(V,C.__webglTexture,e.TEXTURE0+B);let oe=r.get(re);if(re.version!==oe.__version||Y===!0){if(t.activeTexture(e.TEXTURE0+B),(typeof ImageBitmap<"u"&&x.image instanceof ImageBitmap)===!1){let Q=ct.getPrimaries(ct.workingColorSpace),le=x.colorSpace===fn?null:ct.getPrimaries(x.colorSpace),he=x.colorSpace===fn||Q===le?e.NONE:e.BROWSER_DEFAULT_WEBGL;t.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,he)}t.pixelStorei(e.UNPACK_ALIGNMENT,x.unpackAlignment);let ee=m(x.image,!1,o.maxTextureSize);ee=Dt(x,ee);let ie=i.convert(x.format,x.colorSpace),be=i.convert(x.type),fe=g(x.internalFormat,ie,be,x.normalized,x.colorSpace,x.isVideoTexture);$e(V,x);let ae,we=x.mipmaps,Re=x.isVideoTexture!==!0,Le=oe.__version===void 0||Y===!0,N=re.dataReady,se=b(x,ee);if(x.isDepthTexture)fe=E(x.format===er,x.type),Le&&(Re?t.texStorage2D(e.TEXTURE_2D,1,fe,ee.width,ee.height):t.texImage2D(e.TEXTURE_2D,0,fe,ee.width,ee.height,0,ie,be,null));else if(x.isDataTexture)if(we.length>0){Re&&Le&&t.texStorage2D(e.TEXTURE_2D,se,fe,we[0].width,we[0].height);for(let Q=0,le=we.length;Q<le;Q++)ae=we[Q],Re?N&&t.texSubImage2D(e.TEXTURE_2D,Q,0,0,ae.width,ae.height,ie,be,ae.data):t.texImage2D(e.TEXTURE_2D,Q,fe,ae.width,ae.height,0,ie,be,ae.data);x.generateMipmaps=!1}else Re?(Le&&t.texStorage2D(e.TEXTURE_2D,se,fe,ee.width,ee.height),N&&J(x,ee,ie,be)):t.texImage2D(e.TEXTURE_2D,0,fe,ee.width,ee.height,0,ie,be,ee.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){Re&&Le&&t.texStorage3D(e.TEXTURE_2D_ARRAY,se,fe,we[0].width,we[0].height,ee.depth);for(let Q=0,le=we.length;Q<le;Q++)if(ae=we[Q],x.format!==Zt)if(ie!==null)if(Re){if(N)if(x.layerUpdates.size>0){let he=xs(ae.width,ae.height,x.format,x.type);for(let te of x.layerUpdates){let Ae=ae.data.subarray(te*he/ae.data.BYTES_PER_ELEMENT,(te+1)*he/ae.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Q,0,0,te,ae.width,ae.height,1,ie,Ae)}}else t.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Q,0,0,0,ae.width,ae.height,ee.depth,ie,ae.data)}else t.compressedTexImage3D(e.TEXTURE_2D_ARRAY,Q,fe,ae.width,ae.height,ee.depth,0,ae.data,0,0);else qe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Re?N&&t.texSubImage3D(e.TEXTURE_2D_ARRAY,Q,0,0,0,ae.width,ae.height,ee.depth,ie,be,ae.data):t.texImage3D(e.TEXTURE_2D_ARRAY,Q,fe,ae.width,ae.height,ee.depth,0,ie,be,ae.data);x.layerUpdates.size>0&&x.clearLayerUpdates()}else{Re&&Le&&t.texStorage2D(e.TEXTURE_2D,se,fe,we[0].width,we[0].height);for(let Q=0,le=we.length;Q<le;Q++)ae=we[Q],x.format!==Zt?ie!==null?Re?N&&t.compressedTexSubImage2D(e.TEXTURE_2D,Q,0,0,ae.width,ae.height,ie,ae.data):t.compressedTexImage2D(e.TEXTURE_2D,Q,fe,ae.width,ae.height,0,ae.data):qe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Re?N&&t.texSubImage2D(e.TEXTURE_2D,Q,0,0,ae.width,ae.height,ie,be,ae.data):t.texImage2D(e.TEXTURE_2D,Q,fe,ae.width,ae.height,0,ie,be,ae.data)}else if(x.isDataArrayTexture)if(Re){if(Le&&t.texStorage3D(e.TEXTURE_2D_ARRAY,se,fe,ee.width,ee.height,ee.depth),N)if(x.layerUpdates.size>0){let Q=xs(ee.width,ee.height,x.format,x.type);for(let le of x.layerUpdates){let he=ee.data.subarray(le*Q/ee.data.BYTES_PER_ELEMENT,(le+1)*Q/ee.data.BYTES_PER_ELEMENT);t.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,le,ee.width,ee.height,1,ie,be,he)}x.clearLayerUpdates()}else t.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,ee.width,ee.height,ee.depth,ie,be,ee.data)}else t.texImage3D(e.TEXTURE_2D_ARRAY,0,fe,ee.width,ee.height,ee.depth,0,ie,be,ee.data);else if(x.isData3DTexture)Re?(Le&&t.texStorage3D(e.TEXTURE_3D,se,fe,ee.width,ee.height,ee.depth),N&&t.texSubImage3D(e.TEXTURE_3D,0,0,0,0,ee.width,ee.height,ee.depth,ie,be,ee.data)):t.texImage3D(e.TEXTURE_3D,0,fe,ee.width,ee.height,ee.depth,0,ie,be,ee.data);else if(x.isFramebufferTexture){if(Le)if(Re)t.texStorage2D(e.TEXTURE_2D,se,fe,ee.width,ee.height);else{let Q=ee.width,le=ee.height;for(let he=0;he<se;he++)t.texImage2D(e.TEXTURE_2D,he,fe,Q,le,0,ie,be,null),Q>>=1,le>>=1}}else if(x.isHTMLTexture){if("texElementImage2D"in e){let Q=e.canvas;if(Q.hasAttribute("layoutsubtree")||Q.setAttribute("layoutsubtree","true"),ee.parentNode!==Q){Q.appendChild(ee),u.add(x),Q.onpaint=le=>{let he=le.changedElements;for(let te of u)he.includes(te.image)&&(te.needsUpdate=!0)},Q.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,ee);else{let he=e.RGBA,te=e.RGBA,Ae=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,he,te,Ae,ee)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(we.length>0){if(Re&&Le){let Q=Ze(we[0]);t.texStorage2D(e.TEXTURE_2D,se,fe,Q.width,Q.height)}for(let Q=0,le=we.length;Q<le;Q++)ae=we[Q],Re?N&&t.texSubImage2D(e.TEXTURE_2D,Q,0,0,ie,be,ae):t.texImage2D(e.TEXTURE_2D,Q,fe,ie,be,ae);x.generateMipmaps=!1}else if(Re){if(Le){let Q=Ze(ee);t.texStorage2D(e.TEXTURE_2D,se,fe,Q.width,Q.height)}N&&t.texSubImage2D(e.TEXTURE_2D,0,0,0,ie,be,ee)}else t.texImage2D(e.TEXTURE_2D,0,fe,ie,be,ee);p(x)&&S(V),oe.__version=re.version,x.onUpdate&&x.onUpdate(x)}C.__version=x.version}function Ue(C,x,B){if(x.image.length!==6)return;let V=We(C,x),Y=x.source;t.bindTexture(e.TEXTURE_CUBE_MAP,C.__webglTexture,e.TEXTURE0+B);let re=r.get(Y);if(Y.version!==re.__version||V===!0){t.activeTexture(e.TEXTURE0+B);let oe=ct.getPrimaries(ct.workingColorSpace),K=x.colorSpace===fn?null:ct.getPrimaries(x.colorSpace),ee=x.colorSpace===fn||oe===K?e.NONE:e.BROWSER_DEFAULT_WEBGL;t.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(e.UNPACK_ALIGNMENT,x.unpackAlignment),t.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,ee);let ie=x.isCompressedTexture||x.image[0].isCompressedTexture,be=x.image[0]&&x.image[0].isDataTexture,fe=[];for(let te=0;te<6;te++)!ie&&!be?fe[te]=m(x.image[te],!0,o.maxCubemapSize):fe[te]=be?x.image[te].image:x.image[te],fe[te]=Dt(x,fe[te]);let ae=fe[0],we=i.convert(x.format,x.colorSpace),Re=i.convert(x.type),Le=g(x.internalFormat,we,Re,x.normalized,x.colorSpace),N=x.isVideoTexture!==!0,se=re.__version===void 0||V===!0,Q=Y.dataReady,le=b(x,ae);$e(e.TEXTURE_CUBE_MAP,x);let he;if(ie){N&&se&&t.texStorage2D(e.TEXTURE_CUBE_MAP,le,Le,ae.width,ae.height);for(let te=0;te<6;te++){he=fe[te].mipmaps;for(let Ae=0;Ae<he.length;Ae++){let Me=he[Ae];x.format!==Zt?we!==null?N?Q&&t.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ae,0,0,Me.width,Me.height,we,Me.data):t.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ae,Le,Me.width,Me.height,0,Me.data):qe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):N?Q&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ae,0,0,Me.width,Me.height,we,Re,Me.data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ae,Le,Me.width,Me.height,0,we,Re,Me.data)}}}else{if(he=x.mipmaps,N&&se){he.length>0&&le++;let te=Ze(fe[0]);t.texStorage2D(e.TEXTURE_CUBE_MAP,le,Le,te.width,te.height)}for(let te=0;te<6;te++)if(be){N?Q&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,fe[te].width,fe[te].height,we,Re,fe[te].data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,Le,fe[te].width,fe[te].height,0,we,Re,fe[te].data);for(let Ae=0;Ae<he.length;Ae++){let rt=he[Ae].image[te].image;N?Q&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ae+1,0,0,rt.width,rt.height,we,Re,rt.data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ae+1,Le,rt.width,rt.height,0,we,Re,rt.data)}}else{N?Q&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,we,Re,fe[te]):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,Le,we,Re,fe[te]);for(let Ae=0;Ae<he.length;Ae++){let Me=he[Ae];N?Q&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ae+1,0,0,we,Re,Me.image[te]):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+te,Ae+1,Le,we,Re,Me.image[te])}}}p(x)&&S(e.TEXTURE_CUBE_MAP),re.__version=Y.version,x.onUpdate&&x.onUpdate(x)}C.__version=x.version}function _e(C,x,B,V,Y,re){let oe=i.convert(B.format,B.colorSpace),K=i.convert(B.type),ee=g(B.internalFormat,oe,K,B.normalized,B.colorSpace),ie=r.get(x),be=r.get(B);if(be.__renderTarget=x,!ie.__hasExternalTextures){let fe=Math.max(1,x.width>>re),ae=Math.max(1,x.height>>re);Y===e.TEXTURE_3D||Y===e.TEXTURE_2D_ARRAY?t.texImage3D(Y,re,ee,fe,ae,x.depth,0,oe,K,null):t.texImage2D(Y,re,ee,fe,ae,0,oe,K,null)}t.bindFramebuffer(e.FRAMEBUFFER,C),_t(x)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,V,Y,be.__webglTexture,0,ut(x)):(Y===e.TEXTURE_2D||Y>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&Y<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,V,Y,be.__webglTexture,re),t.bindFramebuffer(e.FRAMEBUFFER,null)}function Be(C,x,B){if(e.bindRenderbuffer(e.RENDERBUFFER,C),x.depthBuffer){let V=x.depthTexture,Y=V&&V.isDepthTexture?V.type:null,re=E(x.stencilBuffer,Y),oe=x.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;_t(x)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,ut(x),re,x.width,x.height):B?e.renderbufferStorageMultisample(e.RENDERBUFFER,ut(x),re,x.width,x.height):e.renderbufferStorage(e.RENDERBUFFER,re,x.width,x.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,oe,e.RENDERBUFFER,C)}else{let V=x.textures;for(let Y=0;Y<V.length;Y++){let re=V[Y],oe=i.convert(re.format,re.colorSpace),K=i.convert(re.type),ee=g(re.internalFormat,oe,K,re.normalized,re.colorSpace);_t(x)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,ut(x),ee,x.width,x.height):B?e.renderbufferStorageMultisample(e.RENDERBUFFER,ut(x),ee,x.width,x.height):e.renderbufferStorage(e.RENDERBUFFER,ee,x.width,x.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Mt(C,x,B){let V=x.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(e.FRAMEBUFFER,C),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let Y=r.get(x.depthTexture);if(Y.__renderTarget=x,(!Y.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),V){if(Y.__webglInit===void 0&&(Y.__webglInit=!0,x.depthTexture.addEventListener("dispose",R)),Y.__webglTexture===void 0){Y.__webglTexture=e.createTexture(),t.bindTexture(e.TEXTURE_CUBE_MAP,Y.__webglTexture),$e(e.TEXTURE_CUBE_MAP,x.depthTexture);let ie=i.convert(x.depthTexture.format),be=i.convert(x.depthTexture.type),fe;x.depthTexture.format===Jn?fe=e.DEPTH_COMPONENT24:x.depthTexture.format===er&&(fe=e.DEPTH24_STENCIL8);for(let ae=0;ae<6;ae++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,fe,x.width,x.height,0,ie,be,null)}}else X(x.depthTexture,0);let re=Y.__webglTexture,oe=ut(x),K=V?e.TEXTURE_CUBE_MAP_POSITIVE_X+B:e.TEXTURE_2D,ee=x.depthTexture.format===er?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(x.depthTexture.format===Jn)_t(x)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,ee,K,re,0,oe):e.framebufferTexture2D(e.FRAMEBUFFER,ee,K,re,0);else if(x.depthTexture.format===er)_t(x)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,ee,K,re,0,oe):e.framebufferTexture2D(e.FRAMEBUFFER,ee,K,re,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Ie(C){let x=r.get(C),B=C.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==C.depthTexture){let V=C.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),V){let Y=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,V.removeEventListener("dispose",Y)};V.addEventListener("dispose",Y),x.__depthDisposeCallback=Y}x.__boundDepthTexture=V}if(C.depthTexture&&!x.__autoAllocateDepthBuffer)if(B)for(let V=0;V<6;V++)Mt(x.__webglFramebuffer[V],C,V);else{let V=C.texture.mipmaps;V&&V.length>0?Mt(x.__webglFramebuffer[0],C,0):Mt(x.__webglFramebuffer,C,0)}else if(B){x.__webglDepthbuffer=[];for(let V=0;V<6;V++)if(t.bindFramebuffer(e.FRAMEBUFFER,x.__webglFramebuffer[V]),x.__webglDepthbuffer[V]===void 0)x.__webglDepthbuffer[V]=e.createRenderbuffer(),Be(x.__webglDepthbuffer[V],C,!1);else{let Y=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,re=x.__webglDepthbuffer[V];e.bindRenderbuffer(e.RENDERBUFFER,re),e.framebufferRenderbuffer(e.FRAMEBUFFER,Y,e.RENDERBUFFER,re)}}else{let V=C.texture.mipmaps;if(V&&V.length>0?t.bindFramebuffer(e.FRAMEBUFFER,x.__webglFramebuffer[0]):t.bindFramebuffer(e.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=e.createRenderbuffer(),Be(x.__webglDepthbuffer,C,!1);else{let Y=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,re=x.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,re),e.framebufferRenderbuffer(e.FRAMEBUFFER,Y,e.RENDERBUFFER,re)}}t.bindFramebuffer(e.FRAMEBUFFER,null)}function Xe(C,x,B){let V=r.get(C);x!==void 0&&_e(V.__webglFramebuffer,C,C.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),B!==void 0&&Ie(C)}function nt(C){let x=C.texture,B=r.get(C),V=r.get(x);C.addEventListener("dispose",v);let Y=C.textures,re=C.isWebGLCubeRenderTarget===!0,oe=Y.length>1;if(oe||(V.__webglTexture===void 0&&(V.__webglTexture=e.createTexture()),V.__version=x.version,a.memory.textures++),re){B.__webglFramebuffer=[];for(let K=0;K<6;K++)if(x.mipmaps&&x.mipmaps.length>0){B.__webglFramebuffer[K]=[];for(let ee=0;ee<x.mipmaps.length;ee++)B.__webglFramebuffer[K][ee]=e.createFramebuffer()}else B.__webglFramebuffer[K]=e.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){B.__webglFramebuffer=[];for(let K=0;K<x.mipmaps.length;K++)B.__webglFramebuffer[K]=e.createFramebuffer()}else B.__webglFramebuffer=e.createFramebuffer();if(oe)for(let K=0,ee=Y.length;K<ee;K++){let ie=r.get(Y[K]);ie.__webglTexture===void 0&&(ie.__webglTexture=e.createTexture(),a.memory.textures++)}if(C.samples>0&&_t(C)===!1){B.__webglMultisampledFramebuffer=e.createFramebuffer(),B.__webglColorRenderbuffer=[],t.bindFramebuffer(e.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let K=0;K<Y.length;K++){let ee=Y[K];B.__webglColorRenderbuffer[K]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,B.__webglColorRenderbuffer[K]);let ie=i.convert(ee.format,ee.colorSpace),be=i.convert(ee.type),fe=g(ee.internalFormat,ie,be,ee.normalized,ee.colorSpace,C.isXRRenderTarget===!0),ae=ut(C);e.renderbufferStorageMultisample(e.RENDERBUFFER,ae,fe,C.width,C.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+K,e.RENDERBUFFER,B.__webglColorRenderbuffer[K])}e.bindRenderbuffer(e.RENDERBUFFER,null),C.depthBuffer&&(B.__webglDepthRenderbuffer=e.createRenderbuffer(),Be(B.__webglDepthRenderbuffer,C,!0)),t.bindFramebuffer(e.FRAMEBUFFER,null)}}if(re){t.bindTexture(e.TEXTURE_CUBE_MAP,V.__webglTexture),$e(e.TEXTURE_CUBE_MAP,x);for(let K=0;K<6;K++)if(x.mipmaps&&x.mipmaps.length>0)for(let ee=0;ee<x.mipmaps.length;ee++)_e(B.__webglFramebuffer[K][ee],C,x,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+K,ee);else _e(B.__webglFramebuffer[K],C,x,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+K,0);p(x)&&S(e.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(oe){for(let K=0,ee=Y.length;K<ee;K++){let ie=Y[K],be=r.get(ie),fe=e.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(fe=C.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),t.bindTexture(fe,be.__webglTexture),$e(fe,ie),_e(B.__webglFramebuffer,C,ie,e.COLOR_ATTACHMENT0+K,fe,0),p(ie)&&S(fe)}t.unbindTexture()}else{let K=e.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(K=C.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),t.bindTexture(K,V.__webglTexture),$e(K,x),x.mipmaps&&x.mipmaps.length>0)for(let ee=0;ee<x.mipmaps.length;ee++)_e(B.__webglFramebuffer[ee],C,x,e.COLOR_ATTACHMENT0,K,ee);else _e(B.__webglFramebuffer,C,x,e.COLOR_ATTACHMENT0,K,0);p(x)&&S(K),t.unbindTexture()}C.depthBuffer&&Ie(C)}function Oe(C){let x=C.textures;for(let B=0,V=x.length;B<V;B++){let Y=x[B];if(p(Y)){let re=M(C),oe=r.get(Y).__webglTexture;t.bindTexture(re,oe),S(re),t.unbindTexture()}}}let lt=[],At=[];function Bt(C){if(C.samples>0){if(_t(C)===!1){let x=C.textures,B=C.width,V=C.height,Y=e.COLOR_BUFFER_BIT,re=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,oe=r.get(C),K=x.length>1;if(K)for(let ie=0;ie<x.length;ie++)t.bindFramebuffer(e.FRAMEBUFFER,oe.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ie,e.RENDERBUFFER,null),t.bindFramebuffer(e.FRAMEBUFFER,oe.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ie,e.TEXTURE_2D,null,0);t.bindFramebuffer(e.READ_FRAMEBUFFER,oe.__webglMultisampledFramebuffer);let ee=C.texture.mipmaps;ee&&ee.length>0?t.bindFramebuffer(e.DRAW_FRAMEBUFFER,oe.__webglFramebuffer[0]):t.bindFramebuffer(e.DRAW_FRAMEBUFFER,oe.__webglFramebuffer);for(let ie=0;ie<x.length;ie++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(Y|=e.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(Y|=e.STENCIL_BUFFER_BIT)),K){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,oe.__webglColorRenderbuffer[ie]);let be=r.get(x[ie]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,be,0)}e.blitFramebuffer(0,0,B,V,0,0,B,V,Y,e.NEAREST),l===!0&&(lt.length=0,At.length=0,lt.push(e.COLOR_ATTACHMENT0+ie),C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&(lt.push(re),At.push(re),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,At)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,lt))}if(t.bindFramebuffer(e.READ_FRAMEBUFFER,null),t.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),K)for(let ie=0;ie<x.length;ie++){t.bindFramebuffer(e.FRAMEBUFFER,oe.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ie,e.RENDERBUFFER,oe.__webglColorRenderbuffer[ie]);let be=r.get(x[ie]).__webglTexture;t.bindFramebuffer(e.FRAMEBUFFER,oe.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ie,e.TEXTURE_2D,be,0)}t.bindFramebuffer(e.DRAW_FRAMEBUFFER,oe.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&l){let x=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[x])}}}function ut(C){return Math.min(o.maxSamples,C.samples)}function _t(C){let x=r.get(C);return C.samples>0&&n.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function O(C){let x=a.render.frame;f.get(C)!==x&&(f.set(C,x),C.update())}function Dt(C,x){let B=C.colorSpace,V=C.format,Y=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||B!==rs&&B!==fn&&(ct.getTransfer(B)===tt?(V!==Zt||Y!==Wt)&&qe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):it("WebGLTextures: Unsupported texture color space:",B)),x}function Ze(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=z,this.resetTextureUnits=I,this.getTextureUnits=L,this.setTextureUnits=H,this.setTexture2D=X,this.setTexture2DArray=$,this.setTexture3D=j,this.setTextureCube=Z,this.rebindTextures=Xe,this.setupRenderTarget=nt,this.updateRenderTargetMipmap=Oe,this.updateMultisampleRenderTarget=Bt,this.setupDepthRenderbuffer=Ie,this.setupFrameBufferTexture=_e,this.useMultisampledRTT=_t,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function dv(e,n){function t(r,o=fn){let i,a=ct.getTransfer(o);if(r===Wt)return e.UNSIGNED_BYTE;if(r===Ea)return e.UNSIGNED_SHORT_4_4_4_4;if(r===Ma)return e.UNSIGNED_SHORT_5_5_5_1;if(r===hf)return e.UNSIGNED_INT_5_9_9_9_REV;if(r===pf)return e.UNSIGNED_INT_10F_11F_11F_REV;if(r===uf)return e.BYTE;if(r===df)return e.SHORT;if(r===fo)return e.UNSIGNED_SHORT;if(r===xa)return e.INT;if(r===Hn)return e.UNSIGNED_INT;if(r===yn)return e.FLOAT;if(r===Sn)return e.HALF_FLOAT;if(r===mf)return e.ALPHA;if(r===gf)return e.RGB;if(r===Zt)return e.RGBA;if(r===Jn)return e.DEPTH_COMPONENT;if(r===er)return e.DEPTH_STENCIL;if(r===jo)return e.RED;if(r===Ta)return e.RED_INTEGER;if(r===tr)return e.RG;if(r===ba)return e.RG_INTEGER;if(r===wa)return e.RGBA_INTEGER;if(r===Qo||r===Jo||r===ei||r===ti)if(a===tt)if(i=n.get("WEBGL_compressed_texture_s3tc_srgb"),i!==null){if(r===Qo)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===Jo)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===ei)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===ti)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(i=n.get("WEBGL_compressed_texture_s3tc"),i!==null){if(r===Qo)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===Jo)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===ei)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===ti)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===Aa||r===Ra||r===ya||r===Ca)if(i=n.get("WEBGL_compressed_texture_pvrtc"),i!==null){if(r===Aa)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===Ra)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===ya)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===Ca)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===Pa||r===La||r===Da||r===Ua||r===Ia||r===ni||r===Na)if(i=n.get("WEBGL_compressed_texture_etc"),i!==null){if(r===Pa||r===La)return a===tt?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(r===Da)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(r===Ua)return i.COMPRESSED_R11_EAC;if(r===Ia)return i.COMPRESSED_SIGNED_R11_EAC;if(r===ni)return i.COMPRESSED_RG11_EAC;if(r===Na)return i.COMPRESSED_SIGNED_RG11_EAC}else return null;if(r===Oa||r===Fa||r===Ha||r===Ba||r===Ga||r===ka||r===Va||r===za||r===Wa||r===Xa||r===$a||r===Ya||r===Ka||r===qa)if(i=n.get("WEBGL_compressed_texture_astc"),i!==null){if(r===Oa)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===Fa)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===Ha)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===Ba)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===Ga)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===ka)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===Va)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===za)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===Wa)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===Xa)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===$a)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===Ya)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===Ka)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===qa)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===Za||r===ja||r===Qa)if(i=n.get("EXT_texture_compression_bptc"),i!==null){if(r===Za)return a===tt?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(r===ja)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(r===Qa)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(r===Ja||r===es||r===ri||r===ts)if(i=n.get("EXT_texture_compression_rgtc"),i!==null){if(r===Ja)return i.COMPRESSED_RED_RGTC1_EXT;if(r===es)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(r===ri)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(r===ts)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return r===Pr?e.UNSIGNED_INT_24_8:e[r]!==void 0?e[r]:null}return{convert:t}}var hv=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,pv=`
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

}`,Hs=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(n,t){if(this.texture===null){let r=new ps(n.texture);(n.depthNear!==t.depthNear||n.depthFar!==t.depthFar)&&(this.depthNear=n.depthNear,this.depthFar=n.depthFar),this.texture=r}}getMesh(n){if(this.texture!==null&&this.mesh===null){let t=n.cameras[0].viewport,r=new Qt({vertexShader:hv,fragmentShader:pv,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Rt(new Ct(20,20),r)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Bs=class extends Cf{constructor(n,t){super();let r=this,o=null,i=1,a=null,s="local-floor",l=1,c=null,f=null,u=null,d=null,h=null,_=null,T=typeof XRWebGLBinding<"u",m=new Hs,p={},S=t.getContextAttributes(),M=null,g=null,E=[],b=[],R=new je,v=null,w=null,y=new po;y.viewport=new Ft;let P=new po;P.viewport=new Ft;let D=[y,P],I=new Wf,L=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let J=E[q];return J===void 0&&(J=new ai,E[q]=J),J.getTargetRaySpace()},this.getControllerGrip=function(q){let J=E[q];return J===void 0&&(J=new ai,E[q]=J),J.getGripSpace()},this.getHand=function(q){let J=E[q];return J===void 0&&(J=new ai,E[q]=J),J.getHandSpace()};function z(q){let J=b.indexOf(q.inputSource);if(J===-1)return;let xe=E[J];xe!==void 0&&(xe.update(q.inputSource,q.frame,c||a),xe.dispatchEvent({type:q.type,data:q.inputSource}))}function F(){o.removeEventListener("select",z),o.removeEventListener("selectstart",z),o.removeEventListener("selectend",z),o.removeEventListener("squeeze",z),o.removeEventListener("squeezestart",z),o.removeEventListener("squeezeend",z),o.removeEventListener("end",F),o.removeEventListener("inputsourceschange",X);for(let q=0;q<E.length;q++){let J=b[q];J!==null&&(b[q]=null,E[q].disconnect(J))}L=null,H=null,m.reset();for(let q in p)delete p[q];if(n.setRenderTarget(M),h=null,d=null,u=null,o=null,g=null,We.stop(),r.isPresenting=!1,n.setPixelRatio(v),n.setSize(R.width,R.height,!1),w!==null){let q=w.camera;q.fov=w.fov,q.zoom=w.zoom,q.updateProjectionMatrix(),w=null}r.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){i=q,r.isPresenting===!0&&qe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){s=q,r.isPresenting===!0&&qe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(q){c=q},this.getBaseLayer=function(){return d!==null?d:h},this.getBinding=function(){return u===null&&T&&(u=new XRWebGLBinding(o,t)),u},this.getFrame=function(){return _},this.getSession=function(){return o},this.setSession=async function(q){if(o=q,o!==null){if(M=n.getRenderTarget(),o.addEventListener("select",z),o.addEventListener("selectstart",z),o.addEventListener("selectend",z),o.addEventListener("squeeze",z),o.addEventListener("squeezestart",z),o.addEventListener("squeezeend",z),o.addEventListener("end",F),o.addEventListener("inputsourceschange",X),S.xrCompatible!==!0&&await t.makeXRCompatible(),v=n.getPixelRatio(),n.getSize(R),T&&"createProjectionLayer"in XRWebGLBinding.prototype){let xe=null,Ue=null,_e=null;S.depth&&(_e=S.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,xe=S.stencil?er:Jn,Ue=S.stencil?Pr:Hn);let Be={colorFormat:t.RGBA8,depthFormat:_e,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(Be),o.updateRenderState({layers:[d]}),n.setPixelRatio(1),n.setSize(d.textureWidth,d.textureHeight,!1),g=new jt(d.textureWidth,d.textureHeight,{format:Zt,type:Wt,depthTexture:new ho(d.textureWidth,d.textureHeight,Ue,void 0,void 0,void 0,void 0,void 0,void 0,xe),stencilBuffer:S.stencil,colorSpace:n.outputColorSpace,samples:S.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let xe={antialias:S.antialias,alpha:!0,depth:S.depth,stencil:S.stencil,framebufferScaleFactor:i};h=new XRWebGLLayer(o,t,xe),o.updateRenderState({baseLayer:h}),n.setPixelRatio(1),n.setSize(h.framebufferWidth,h.framebufferHeight,!1),g=new jt(h.framebufferWidth,h.framebufferHeight,{format:Zt,type:Wt,colorSpace:n.outputColorSpace,stencilBuffer:S.stencil,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}g.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await o.requestReferenceSpace(s),We.setContext(o),We.start(),r.isPresenting=!0,r.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(o!==null)return o.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function X(q){for(let J=0;J<q.removed.length;J++){let xe=q.removed[J],Ue=b.indexOf(xe);Ue>=0&&(b[Ue]=null,E[Ue].disconnect(xe))}for(let J=0;J<q.added.length;J++){let xe=q.added[J],Ue=b.indexOf(xe);if(Ue===-1){for(let Be=0;Be<E.length;Be++)if(Be>=b.length){b.push(xe),Ue=Be;break}else if(b[Be]===null){b[Be]=xe,Ue=Be;break}if(Ue===-1)break}let _e=E[Ue];_e&&_e.connect(xe)}}let $=new ne,j=new ne;function Z(q,J,xe){$.setFromMatrixPosition(J.matrixWorld),j.setFromMatrixPosition(xe.matrixWorld);let Ue=$.distanceTo(j),_e=J.projectionMatrix.elements,Be=xe.projectionMatrix.elements,Mt=_e[14]/(_e[10]-1),Ie=_e[14]/(_e[10]+1),Xe=(_e[9]+1)/_e[5],nt=(_e[9]-1)/_e[5],Oe=(_e[8]-1)/_e[0],lt=(Be[8]+1)/Be[0],At=Mt*Oe,Bt=Mt*lt,ut=Ue/(-Oe+lt),_t=ut*-Oe;if(J.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(_t),q.translateZ(ut),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),_e[10]===-1)q.projectionMatrix.copy(J.projectionMatrix),q.projectionMatrixInverse.copy(J.projectionMatrixInverse);else{let O=Mt+ut,Dt=Ie+ut,Ze=At-_t,C=Bt+(Ue-_t),x=Xe*Ie/Dt*O,B=nt*Ie/Dt*O;q.projectionMatrix.makePerspective(Ze,C,x,B,O,Dt),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function ge(q,J){J===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(J.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(o===null)return;let J=q.near,xe=q.far;m.texture!==null&&(m.depthNear>0&&(J=m.depthNear),m.depthFar>0&&(xe=m.depthFar)),I.near=P.near=y.near=J,I.far=P.far=y.far=xe,(L!==I.near||H!==I.far)&&(o.updateRenderState({depthNear:I.near,depthFar:I.far}),L=I.near,H=I.far),I.layers.mask=q.layers.mask|6,y.layers.mask=I.layers.mask&-5,P.layers.mask=I.layers.mask&-3;let Ue=q.parent,_e=I.cameras;ge(I,Ue);for(let Be=0;Be<_e.length;Be++)ge(_e[Be],Ue);_e.length===2?Z(I,y,P):I.projectionMatrix.copy(y.projectionMatrix),w===null&&q.isPerspectiveCamera&&(w={camera:q,fov:q.fov,zoom:q.zoom}),Ee(q,I,Ue)};function Ee(q,J,xe){xe===null?q.matrix.copy(J.matrixWorld):(q.matrix.copy(xe.matrixWorld),q.matrix.invert(),q.matrix.multiply(J.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(J.projectionMatrix),q.projectionMatrixInverse.copy(J.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=Pf*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return I},this.getFoveation=function(){if(!(d===null&&h===null))return l},this.setFoveation=function(q){l=q,d!==null&&(d.fixedFoveation=q),h!==null&&h.fixedFoveation!==void 0&&(h.fixedFoveation=q)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(I)},this.getCameraTexture=function(q){return p[q]};let ze=null;function $e(q,J){if(f=J.getViewerPose(c||a),_=J,f!==null){let xe=f.views;h!==null&&(n.setRenderTargetFramebuffer(g,h.framebuffer),n.setRenderTarget(g));let Ue=!1;xe.length!==I.cameras.length&&(I.cameras.length=0,Ue=!0);for(let Ie=0;Ie<xe.length;Ie++){let Xe=xe[Ie],nt=null;if(h!==null)nt=h.getViewport(Xe);else{let lt=u.getViewSubImage(d,Xe);nt=lt.viewport,Ie===0&&(n.setRenderTargetTextures(g,lt.colorTexture,lt.depthStencilTexture),n.setRenderTarget(g))}let Oe=D[Ie];Oe===void 0&&(Oe=new po,Oe.layers.enable(Ie),Oe.viewport=new Ft,D[Ie]=Oe),Oe.matrix.fromArray(Xe.transform.matrix),Oe.matrix.decompose(Oe.position,Oe.quaternion,Oe.scale),Oe.projectionMatrix.fromArray(Xe.projectionMatrix),Oe.projectionMatrixInverse.copy(Oe.projectionMatrix).invert(),Oe.viewport.set(nt.x,nt.y,nt.width,nt.height),Ie===0&&(I.matrix.copy(Oe.matrix),I.matrix.decompose(I.position,I.quaternion,I.scale)),Ue===!0&&I.cameras.push(Oe)}let _e=o.enabledFeatures;if(_e&&_e.includes("depth-sensing")&&o.depthUsage=="gpu-optimized"&&T){u=r.getBinding();let Ie=u.getDepthInformation(xe[0]);Ie&&Ie.isValid&&Ie.texture&&m.init(Ie,o.renderState)}if(_e&&_e.includes("camera-access")&&T){n.state.unbindTexture(),u=r.getBinding();for(let Ie=0;Ie<xe.length;Ie++){let Xe=xe[Ie].camera;if(Xe){let nt=p[Xe];nt||(nt=new ps,p[Xe]=nt);let Oe=u.getCameraImage(Xe);nt.sourceTexture=Oe}}}}for(let xe=0;xe<E.length;xe++){let Ue=b[xe],_e=E[xe];Ue!==null&&_e!==void 0&&_e.update(Ue,J,c||a)}ze&&ze(q,J),J.detectedPlanes&&r.dispatchEvent({type:"planesdetected",data:J}),_=null}let We=new Eu;We.setAnimationLoop($e),this.setAnimationLoop=function(q){ze=q},this.dispose=function(){}}},mv=new $t,Ru=new He;Ru.set(-1,0,0,0,1,0,0,0,1);function gv(e,n){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function r(m,p){p.color.getRGB(m.fogColor.value,gs(e)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function o(m,p,S,M,g){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?i(m,p):p.isMeshLambertMaterial?(i(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(i(m,p),u(m,p)):p.isMeshPhongMaterial?(i(m,p),f(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(i(m,p),d(m,p),p.isMeshPhysicalMaterial&&h(m,p,g)):p.isMeshMatcapMaterial?(i(m,p),_(m,p)):p.isMeshDepthMaterial?i(m,p):p.isMeshDistanceMaterial?(i(m,p),T(m,p)):p.isMeshNormalMaterial?i(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&s(m,p)):p.isPointsMaterial?l(m,p,S,M):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function i(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===kt&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===kt&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);let S=n.get(p),M=S.envMap,g=S.envMapRotation;M&&(m.envMap.value=M,m.envMapRotation.value.setFromMatrix4(mv.makeRotationFromEuler(g)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(Ru),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function s(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,S,M){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*S,m.scale.value=M*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function f(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function u(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function d(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function h(m,p,S){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===kt&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.retroreflectivity>0&&(m.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=S.texture,m.transmissionSamplerSize.value.set(S.width,S.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function _(m,p){p.matcap&&(m.matcap.value=p.matcap)}function T(m,p){let S=n.get(p).light;m.referencePosition.value.setFromMatrixPosition(S.matrixWorld),m.nearDistance.value=S.shadow.camera.near,m.farDistance.value=S.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:o}}function _v(e,n,t,r){let o={},i={},a=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function l(g,E){let b=E.program;r.uniformBlockBinding(g,b)}function c(g,E){let b=o[g.id];b===void 0&&(m(g),b=f(g),o[g.id]=b,g.addEventListener("dispose",S));let R=E.program;r.updateUBOMapping(g,R);let v=n.render.frame;i[g.id]!==v&&(d(g),i[g.id]=v)}function f(g){let E=u();g.__bindingPointIndex=E;let b=e.createBuffer(),R=g.__size,v=g.usage;return e.bindBuffer(e.UNIFORM_BUFFER,b),e.bufferData(e.UNIFORM_BUFFER,R,v),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,E,b),b}function u(){for(let g=0;g<s;g++)if(a.indexOf(g)===-1)return a.push(g),g;return it("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(g){let E=o[g.id],b=g.uniforms,R=g.__cache;e.bindBuffer(e.UNIFORM_BUFFER,E);for(let v=0,w=b.length;v<w;v++){let y=b[v];if(Array.isArray(y))for(let P=0,D=y.length;P<D;P++)h(y[P],v,P,R);else h(y,v,0,R)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function h(g,E,b,R){if(T(g,E,b,R)===!0){let v=g.__offset,w=g.value;if(Array.isArray(w)){let y=0;for(let P=0;P<w.length;P++){let D=w[P],I=p(D);_(D,g.__data,y),typeof D!="number"&&typeof D!="boolean"&&!D.isMatrix3&&!ArrayBuffer.isView(D)&&(y+=I.storage/Float32Array.BYTES_PER_ELEMENT)}}else _(w,g.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,v,g.__data)}}function _(g,E,b){typeof g=="number"||typeof g=="boolean"?E[0]=g:g.isMatrix3?(E[0]=g.elements[0],E[1]=g.elements[1],E[2]=g.elements[2],E[3]=0,E[4]=g.elements[3],E[5]=g.elements[4],E[6]=g.elements[5],E[7]=0,E[8]=g.elements[6],E[9]=g.elements[7],E[10]=g.elements[8],E[11]=0):ArrayBuffer.isView(g)?E.set(new g.constructor(g.buffer,g.byteOffset,E.length)):g.toArray(E,b)}function T(g,E,b,R){let v=g.value,w=E+"_"+b;if(R[w]===void 0)return typeof v=="number"||typeof v=="boolean"?R[w]=v:ArrayBuffer.isView(v)?R[w]=v.slice():R[w]=v.clone(),!0;{let y=R[w];if(typeof v=="number"||typeof v=="boolean"){if(y!==v)return R[w]=v,!0}else{if(ArrayBuffer.isView(v))return!0;if(y.equals(v)===!1)return y.copy(v),!0}}return!1}function m(g){let E=g.uniforms,b=0,R=16;for(let w=0,y=E.length;w<y;w++){let P=Array.isArray(E[w])?E[w]:[E[w]];for(let D=0,I=P.length;D<I;D++){let L=P[D],H=Array.isArray(L.value)?L.value:[L.value];for(let z=0,F=H.length;z<F;z++){let X=H[z],$=p(X),j=b%R,Z=j%$.boundary,ge=j+Z;b+=Z,ge!==0&&R-ge<$.storage&&(b+=R-ge),L.__data=new Float32Array($.storage/Float32Array.BYTES_PER_ELEMENT),L.__offset=b,b+=$.storage}}}let v=b%R;return v>0&&(b+=R-v),g.__size=b,g.__cache={},this}function p(g){let E={boundary:0,storage:0};return typeof g=="number"||typeof g=="boolean"?(E.boundary=4,E.storage=4):g.isVector2?(E.boundary=8,E.storage=8):g.isVector3||g.isColor?(E.boundary=16,E.storage=12):g.isVector4?(E.boundary=16,E.storage=16):g.isMatrix3?(E.boundary=48,E.storage=48):g.isMatrix4?(E.boundary=64,E.storage=64):g.isTexture?qe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(g)?(E.boundary=16,E.storage=g.byteLength):qe("WebGLRenderer: Unsupported uniform value type.",g),E}function S(g){let E=g.target;E.removeEventListener("dispose",S);let b=a.indexOf(E.__bindingPointIndex);a.splice(b,1),e.deleteBuffer(o[E.id]),delete o[E.id],delete i[E.id]}function M(){for(let g in o)e.deleteBuffer(o[g]);a=[],o={},i={}}return{bind:l,update:c,dispose:M}}var vv=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),En=null;function Sv(){return En===null&&(En=new Bn(vv,16,16,tr,Sn),En.name="DFG_LUT",En.minFilter=St,En.magFilter=St,En.wrapS=qo,En.wrapT=qo,En.generateMipmaps=!1,En.needsUpdate=!0),En}var xu=class{constructor(n={}){let{canvas:t=wf(),context:r=null,depth:o=!0,stencil:i=!1,alpha:a=!1,antialias:s=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:f="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:h=Wt}=n;this.isWebGLRenderer=!0;let _;if(r!==null){if(typeof WebGLRenderingContext<"u"&&r instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");_=r.getContextAttributes().alpha}else _=a;let T=h,m=new Set([wa,ba,Ta]),p=new Set([Wt,Hn,fo,Pr,Ea,Ma]),S=new Uint32Array(4),M=new Int32Array(4),g=new ne,E=null,b=null,R=[],v=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=ln,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let y=this,P=!1,D=null,I=null,L=null,H=null;this._outputColorSpace=Lr;let z=0,F=0,X=null,$=-1,j=null,Z=new Ft,ge=new Ft,Ee=null,ze=new ye(0),$e=0,We=t.width,q=t.height,J=1,xe=null,Ue=null,_e=new Ft(0,0,We,q),Be=new Ft(0,0,We,q),Mt=!1,Ie=new ds,Xe=!1,nt=!1,Oe=new $t,lt=new ne,At=new Ft,Bt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ut=!1;function _t(){return X===null?J:1}let O=r;function Dt(A,U){return t.getContext(A,U)}let Ze,C,x,B,V,Y,re,oe,K,ee,ie,be,fe,ae,we,Re,Le,N,se,Q,le,he,te;try{let A={alpha:!0,depth:o,stencil:i,antialias:s,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:f,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",rt,!1),t.addEventListener("webglcontextrestored",Ye,!1),t.addEventListener("webglcontextcreationerror",sn,!1),O===null){let U="webgl2";if(O=Dt(U,A),O===null)throw Dt(U)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ae()}catch(A){throw t.removeEventListener("webglcontextlost",rt,!1),t.removeEventListener("webglcontextrestored",Ye,!1),t.removeEventListener("webglcontextcreationerror",sn,!1),it("WebGLRenderer: "+A.message),A}function Ae(){Ze=new Ag(O),Ze.init(),le=new dv(O,Ze),C=new gg(O,Ze,n,le),x=new fv(O,Ze),C.reversedDepthBuffer&&d&&x.buffers.depth.setReversed(!0),I=O.createFramebuffer(),L=O.createFramebuffer(),H=O.createFramebuffer(),B=new Cg(O),V=new Z_,Y=new uv(O,Ze,x,V,C,le,B),re=new wg(y),oe=new Lp(O),he=new pg(O,oe),K=new Rg(O,oe,B,he),ee=new Lg(O,K,oe,he,B),N=new Pg(O,C,Y),we=new _g(V),ie=new q_(y,re,Ze,C,he,we),be=new gv(y,V),fe=new Q_,ae=new ov(Ze),Le=new hg(y,re,x,ee,_,l),Re=new cv(y,ee,C),te=new _v(O,B,C,x),se=new mg(O,Ze,B),Q=new yg(O,Ze,B),B.programs=ie.programs,y.capabilities=C,y.extensions=Ze,y.properties=V,y.renderLists=fe,y.shadowMap=Re,y.state=x,y.info=B}T!==Wt&&(w=new Ug(T,t.width,t.height,s,o,i));let Me=new Bs(y,O);this.xr=Me,this.getContext=function(){return O},this.getContextAttributes=function(){return O.getContextAttributes()},this.forceContextLoss=function(){let A=Ze.get("WEBGL_lose_context");A&&A.loseContext()},this.forceContextRestore=function(){let A=Ze.get("WEBGL_lose_context");A&&A.restoreContext()},this.getPixelRatio=function(){return J},this.setPixelRatio=function(A){A!==void 0&&(J=A,this.setSize(We,q,!1))},this.getSize=function(A){return A.set(We,q)},this.setSize=function(A,U,W=!0){if(Me.isPresenting){qe("WebGLRenderer: Can't change size while VR device is presenting.");return}We=A,q=U,t.width=Math.floor(A*J),t.height=Math.floor(U*J),W===!0&&(t.style.width=A+"px",t.style.height=U+"px"),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,A,U)},this.getDrawingBufferSize=function(A){return A.set(We*J,q*J).floor()},this.setDrawingBufferSize=function(A,U,W){We=A,q=U,J=W,t.width=Math.floor(A*W),t.height=Math.floor(U*W),this.setViewport(0,0,A,U)},this.setEffects=function(A){if(T===Wt){it("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(A){for(let U=0;U<A.length;U++)if(A[U].isOutputPass===!0){qe("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}w.setEffects(A||[])},this.getCurrentViewport=function(A){return A.copy(Z)},this.getViewport=function(A){return A.copy(_e)},this.setViewport=function(A,U,W,G){A.isVector4?_e.set(A.x,A.y,A.z,A.w):_e.set(A,U,W,G),x.viewport(Z.copy(_e).multiplyScalar(J).round())},this.getScissor=function(A){return A.copy(Be)},this.setScissor=function(A,U,W,G){A.isVector4?Be.set(A.x,A.y,A.z,A.w):Be.set(A,U,W,G),x.scissor(ge.copy(Be).multiplyScalar(J).round())},this.getScissorTest=function(){return Mt},this.setScissorTest=function(A){x.setScissorTest(Mt=A)},this.setOpaqueSort=function(A){xe=A},this.setTransparentSort=function(A){Ue=A},this.getClearColor=function(A){return A.copy(Le.getClearColor())},this.setClearColor=function(){Le.setClearColor(...arguments)},this.getClearAlpha=function(){return Le.getClearAlpha()},this.setClearAlpha=function(){Le.setClearAlpha(...arguments)},this.clear=function(A=!0,U=!0,W=!0){let G=0;if(A){let k=!1;if(X!==null){let de=X.texture.format;k=m.has(de)}if(k){let de=X.texture.type,me=p.has(de),ue=Le.getClearColor(),ve=Le.getClearAlpha(),Te=ue.r,De=ue.g,Ne=ue.b;me?(S[0]=Te,S[1]=De,S[2]=Ne,S[3]=ve,O.clearBufferuiv(O.COLOR,0,S)):(M[0]=Te,M[1]=De,M[2]=Ne,M[3]=ve,O.clearBufferiv(O.COLOR,0,M))}else G|=O.COLOR_BUFFER_BIT}U&&(G|=O.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),W&&(G|=O.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),G!==0&&O.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(A){A.setRenderer(this),D=A},this.dispose=function(){t.removeEventListener("webglcontextlost",rt,!1),t.removeEventListener("webglcontextrestored",Ye,!1),t.removeEventListener("webglcontextcreationerror",sn,!1),Le.dispose(),fe.dispose(),ae.dispose(),V.dispose(),re.dispose(),ee.dispose(),he.dispose(),te.dispose(),ie.dispose(),Me.dispose(),Me.removeEventListener("sessionstart",nc),Me.removeEventListener("sessionend",rc),qn.stop()};function rt(A){A.preventDefault(),ls("WebGLRenderer: Context Lost."),P=!0}function Ye(){ls("WebGLRenderer: Context Restored."),P=!1;let A=B.autoReset,U=Re.enabled,W=Re.autoUpdate,G=Re.needsUpdate,k=Re.type;Ae(),B.autoReset=A,Re.enabled=U,Re.autoUpdate=W,Re.needsUpdate=G,Re.type=k}function sn(A){it("WebGLRenderer: A WebGL context could not be created. Reason: ",A.statusMessage)}function gn(A){let U=A.target;U.removeEventListener("dispose",gn),Sp(U)}function Sp(A){xp(A),V.remove(A)}function xp(A){let U=V.get(A).programs;U!==void 0&&(U.forEach(function(W){ie.releaseProgram(W)}),A.isShaderMaterial&&ie.releaseShaderCache(A))}this.renderBufferDirect=function(A,U,W,G,k,de){U===null&&(U=Bt);let me=k.isMesh&&k.matrixWorld.determinantAffine()<0,ue=Tp(A,U,W,G,k);x.setMaterial(G,me);let ve=W.index,Te=1;if(G.wireframe===!0){if(ve=K.getWireframeAttribute(W),ve===void 0)return;Te=2}let De=W.drawRange,Ne=W.attributes.position,Se=De.start*Te,Ke=(De.start+De.count)*Te;de!==null&&(Se=Math.max(Se,de.start*Te),Ke=Math.min(Ke,(de.start+de.count)*Te)),ve!==null?(Se=Math.max(Se,0),Ke=Math.min(Ke,ve.count)):Ne!=null&&(Se=Math.max(Se,0),Ke=Math.min(Ke,Ne.count));let vt=Ke-Se;if(vt<0||vt===1/0)return;he.setup(k,G,ue,W,ve);let st,et=se;if(ve!==null&&(st=oe.get(ve),et=Q,et.setIndex(st)),k.isMesh)G.wireframe===!0?(x.setLineWidth(G.wireframeLinewidth*_t()),et.setMode(O.LINES)):et.setMode(O.TRIANGLES);else if(k.isLine){let Ut=G.linewidth;Ut===void 0&&(Ut=1),x.setLineWidth(Ut*_t()),k.isLineSegments?et.setMode(O.LINES):k.isLineLoop?et.setMode(O.LINE_LOOP):et.setMode(O.LINE_STRIP)}else k.isPoints?et.setMode(O.POINTS):k.isSprite&&et.setMode(O.TRIANGLES);if(k.isBatchedMesh)if(Ze.get("WEBGL_multi_draw"))et.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{let Ut=k._multiDrawStarts,pe=k._multiDrawCounts,Ot=k._multiDrawCount,ke=ve?oe.get(ve).bytesPerElement:1,Kt=V.get(G).currentProgram.getUniforms();for(let _n=0;_n<Ot;_n++)Kt.setValue(O,"_gl_DrawID",_n),et.render(Ut[_n]/ke,pe[_n])}else if(k.isInstancedMesh)et.renderInstances(Se,vt,k.count);else if(W.isInstancedBufferGeometry){let Ut=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,pe=Math.min(W.instanceCount,Ut);et.renderInstances(Se,vt,pe)}else et.render(Se,vt)};function tc(A,U,W,G){D!==null&&A.isNodeMaterial&&D.setObject(G,A),Xe===!0&&we.setState(A,W,!1),A.transparent===!0&&A.side===qt&&A.forceSinglePass===!1?(A.side=kt,A.needsUpdate=!0,zo(A,U,G),A.side=Rr,A.needsUpdate=!0,zo(A,U,G),A.side=qt):zo(A,U,G)}this.compile=function(A,U,W=null){W===null&&(W=A),D!==null&&D.renderStart(A,U,W),b=ae.get(W),b.init(U),v.push(b),W.traverseVisible(function(k){k.isLight&&k.layers.test(U.layers)&&(b.pushLight(k),k.castShadow&&b.pushShadow(k))}),A!==W&&A.traverseVisible(function(k){k.isLight&&k.layers.test(U.layers)&&(b.pushLight(k),k.castShadow&&b.pushShadow(k))}),b.setupLights(),D!==null&&D.updateLights(b.state.lightsArray),nt=this.localClippingEnabled,Xe=we.init(this.clippingPlanes,nt),Xe===!0&&we.setGlobalState(this.clippingPlanes,U),D!==null&&Re.render(b.state.shadowsArray,W,U);let G=new Set;return A.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;let de=k.material;if(de)if(Array.isArray(de))for(let me=0;me<de.length;me++){let ue=de[me];tc(ue,W,U,k),G.add(ue)}else tc(de,W,U,k),G.add(de)}),b=v.pop(),D!==null&&D.renderEnd(),G},this.compileAsync=function(A,U,W=null){let G=this.compile(A,U,W);return new Promise(k=>{function de(){if(G.forEach(function(me){let ve=V.get(me).currentProgram;(ve===void 0||ve.isReady())&&G.delete(me)}),G.size===0){k(A);return}setTimeout(de,10)}Ze.get("KHR_parallel_shader_compile")!==null?de():setTimeout(de,10)})};let na=null;function Ep(A){na&&na(A)}function nc(){qn.stop()}function rc(){qn.start()}let qn=new Eu;qn.setAnimationLoop(Ep),typeof self<"u"&&qn.setContext(self),this.setAnimationLoop=function(A){na=A,Me.setAnimationLoop(A),A===null?qn.stop():qn.start()},Me.addEventListener("sessionstart",nc),Me.addEventListener("sessionend",rc),this.render=function(A,U){if(U!==void 0&&U.isCamera!==!0){it("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(P===!0)return;D!==null&&D.renderStart(A,U);let W=Me.enabled===!0&&Me.isPresenting===!0,G=w!==null&&(X===null||W)&&w.begin(y,X);if(A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),Me.enabled===!0&&Me.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(Me.cameraAutoUpdate===!0&&Me.updateCamera(U),U=Me.getCamera()),A.isScene===!0&&A.onBeforeRender(y,A,U,X),b=ae.get(A,v.length),b.init(U),b.state.textureUnits=Y.getTextureUnits(),v.push(b),Oe.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),Ie.setFromProjectionMatrix(Oe,ss,U.reversedDepth),nt=this.localClippingEnabled,Xe=we.init(this.clippingPlanes,nt),E=fe.get(A,R.length),E.init(),R.push(E),Me.enabled===!0&&Me.isPresenting===!0){let me=y.xr.getDepthSensingMesh();me!==null&&ra(me,U,-1/0,y.sortObjects)}ra(A,U,0,y.sortObjects),E.finish(),D!==null&&D.updateLights(b.state.lightsArray),y.sortObjects===!0&&E.sort(xe,Ue),ut=Me.enabled===!1||Me.isPresenting===!1||Me.hasDepthSensing()===!1,ut&&Le.addToRenderList(E,A),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),Xe===!0&&we.beginShadows();let k=b.state.shadowsArray;if(Re.render(k,A,U),Xe===!0&&we.endShadows(),(G&&w.hasRenderPass())===!1){let me=E.opaque,ue=E.transmissive;if(b.setupLights(),U.isArrayCamera){let ve=U.cameras;if(ue.length>0)for(let Te=0,De=ve.length;Te<De;Te++){let Ne=ve[Te];ic(me,ue,A,Ne)}ut&&Le.render(A);for(let Te=0,De=ve.length;Te<De;Te++){let Ne=ve[Te];oc(E,A,Ne,Ne.viewport)}}else ue.length>0&&ic(me,ue,A,U),ut&&Le.render(A),oc(E,A,U)}X!==null&&F===0&&(Y.updateMultisampleRenderTarget(X),Y.updateRenderTargetMipmap(X)),G&&w.end(y),A.isScene===!0&&A.onAfterRender(y,A,U),he.resetDefaultState(),$=-1,j=null,v.pop(),v.length>0?(b=v[v.length-1],Y.setTextureUnits(b.state.textureUnits),Xe===!0&&we.setGlobalState(y.clippingPlanes,b.state.camera)):b=null,R.pop(),R.length>0?E=R[R.length-1]:E=null,D!==null&&D.renderEnd()};function ra(A,U,W,G){if(A.visible===!1)return;if(A.layers.test(U.layers)){if(A.isGroup)W=A.renderOrder;else if(A.isLOD)A.autoUpdate===!0&&A.update(U);else if(A.isLightProbeGrid)b.pushLightProbeGrid(A);else if(A.isLight)b.pushLight(A),A.castShadow&&b.pushShadow(A);else if(A.isSprite){if(!A.frustumCulled||A.intersectsFrustum(Ie)){G&&At.setFromMatrixPosition(A.matrixWorld).applyMatrix4(Oe);let me=ee.update(A),ue=A.material;ue.visible&&E.push(A,me,ue,W,At.z,null,U)}}else if((A.isMesh||A.isLine||A.isPoints)&&(!A.frustumCulled||A.intersectsFrustum(Ie))){let me=ee.update(A),ue=A.material;if(G&&(A.boundingSphere!==void 0?(A.boundingSphere===null&&A.computeBoundingSphere(),At.copy(A.boundingSphere.center)):(me.boundingSphere===null&&me.computeBoundingSphere(),At.copy(me.boundingSphere.center)),At.applyMatrix4(A.matrixWorld).applyMatrix4(Oe)),Array.isArray(ue)){let ve=me.groups;for(let Te=0,De=ve.length;Te<De;Te++){let Ne=ve[Te],Se=ue[Ne.materialIndex];Se&&Se.visible&&E.push(A,me,Se,W,At.z,Ne,U)}}else ue.visible&&E.push(A,me,ue,W,At.z,null,U)}}let de=A.children;for(let me=0,ue=de.length;me<ue;me++)ra(de[me],U,W,G)}function oc(A,U,W,G){let{opaque:k,transmissive:de,transparent:me}=A;b.setupLightsView(W),Xe===!0&&we.setGlobalState(y.clippingPlanes,W),G&&x.viewport(Z.copy(G)),k.length>0&&Vo(k,U,W),de.length>0&&Vo(de,U,W),me.length>0&&Vo(me,U,W),x.buffers.depth.setTest(!0),x.buffers.depth.setMask(!0),x.buffers.color.setMask(!0),x.setPolygonOffset(!1)}function ic(A,U,W,G){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(b.state.transmissionRenderTarget[G.id]===void 0){let Se=Ze.has("EXT_color_buffer_half_float")||Ze.has("EXT_color_buffer_float");b.state.transmissionRenderTarget[G.id]=new jt(1,1,{generateMipmaps:!0,type:Se?Sn:Wt,minFilter:zt,samples:Math.max(4,C.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ct.workingColorSpace})}let de=b.state.transmissionRenderTarget[G.id],me=G.viewport||Z;de.setSize(me.z*y.transmissionResolutionScale,me.w*y.transmissionResolutionScale);let ue=y.getRenderTarget(),ve=y.getActiveCubeFace(),Te=y.getActiveMipmapLevel();y.setRenderTarget(de),y.getClearColor(ze),$e=y.getClearAlpha(),$e<1&&y.setClearColor(16777215,.5),y.clear(),ut&&Le.render(W);let De=y.toneMapping;y.toneMapping=ln;let Ne=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),b.setupLightsView(G),Xe===!0&&we.setGlobalState(y.clippingPlanes,G),Vo(A,W,G),Y.updateMultisampleRenderTarget(de),Y.updateRenderTargetMipmap(de),Ze.has("WEBGL_multisampled_render_to_texture")===!1){let Se=!1;for(let Ke=0,vt=U.length;Ke<vt;Ke++){let st=U[Ke],{object:et,geometry:Ut,material:pe,group:Ot}=st;if(pe.side===qt&&et.layers.test(G.layers)){let ke=pe.side;pe.side=kt,pe.needsUpdate=!0,ac(et,W,G,Ut,pe,Ot),pe.side=ke,pe.needsUpdate=!0,Se=!0}}Se===!0&&(Y.updateMultisampleRenderTarget(de),Y.updateRenderTargetMipmap(de))}y.setRenderTarget(ue,ve,Te),y.setClearColor(ze,$e),Ne!==void 0&&(G.viewport=Ne),y.toneMapping=De}function Vo(A,U,W){let G=U.isScene===!0?U.overrideMaterial:null;for(let k=0,de=A.length;k<de;k++){let me=A[k],{object:ue,geometry:ve,group:Te}=me,De=me.material;De.allowOverride===!0&&G!==null&&(De=G),ue.layers.test(W.layers)&&ac(ue,U,W,ve,De,Te)}}function ac(A,U,W,G,k,de){D!==null&&k.isNodeMaterial&&D.setObject(A,k),A.onBeforeRender(y,U,W,G,k,de),A.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,A.matrixWorld),A.normalMatrix.getNormalMatrix(A.modelViewMatrix),k.onBeforeRender(y,U,W,G,A,de),k.transparent===!0&&k.side===qt&&k.forceSinglePass===!1?(k.side=kt,k.needsUpdate=!0,y.renderBufferDirect(W,U,G,k,A,de),k.side=Rr,k.needsUpdate=!0,y.renderBufferDirect(W,U,G,k,A,de),k.side=qt):y.renderBufferDirect(W,U,G,k,A,de),A.onAfterRender(y,U,W,G,k,de)}function zo(A,U,W){U.isScene!==!0&&(U=Bt);let G=V.get(A),k=b.state.lights,de=b.state.shadowsArray,me=k.state.version,ue=ie.getParameters(A,k.state,de,U,W,b.state.lightProbeGridArray),ve=ie.getProgramCacheKey(ue),Te=G.programs;G.environment=A.isMeshStandardMaterial||A.isMeshLambertMaterial||A.isMeshPhongMaterial?U.environment:null,G.fog=U.fog;let De=A.isMeshStandardMaterial||A.isMeshLambertMaterial&&!A.envMap||A.isMeshPhongMaterial&&!A.envMap;G.envMap=re.get(A.envMap||G.environment,De),G.envMapRotation=G.environment!==null&&A.envMap===null?U.environmentRotation:A.envMapRotation,Te===void 0&&(A.addEventListener("dispose",gn),Te=new Map,G.programs=Te);let Ne=Te.get(ve);if(Ne!==void 0){if(G.currentProgram===Ne&&G.lightsStateVersion===me)return lc(A,ue),Ne}else ue.uniforms=ie.getUniforms(A),D!==null&&A.isNodeMaterial&&D.build(A,W,ue),A.onBeforeCompile(ue,y),Ne=ie.acquireProgram(ue,ve),Te.set(ve,Ne),G.uniforms=ue.uniforms;let Se=G.uniforms;return(!A.isShaderMaterial&&!A.isRawShaderMaterial||A.clipping===!0)&&(Se.clippingPlanes=we.uniform),lc(A,ue),G.needsLights=wp(A),G.lightsStateVersion=me,G.needsLights&&(Se.ambientLightColor.value=k.state.ambient,Se.lightProbe.value=k.state.probe,Se.sunLights.value=k.state.sun,Se.sunLightShadows.value=k.state.sunShadow,Se.directionalLights.value=k.state.directional,Se.directionalLightShadows.value=k.state.directionalShadow,Se.spotLights.value=k.state.spot,Se.spotLightShadows.value=k.state.spotShadow,Se.rectAreaLights.value=k.state.rectArea,Se.ltc_1.value=k.state.rectAreaLTC1,Se.ltc_2.value=k.state.rectAreaLTC2,Se.pointLights.value=k.state.point,Se.pointLightShadows.value=k.state.pointShadow,Se.hemisphereLights.value=k.state.hemi,Se.sunShadowMatrix.value=k.state.sunShadowMatrix,Se.sunShadowCascade.value=k.state.sunShadowCascade,Se.directionalShadowMatrix.value=k.state.directionalShadowMatrix,Se.spotLightMatrix.value=k.state.spotLightMatrix,Se.spotLightMap.value=k.state.spotLightMap,Se.pointShadowMatrix.value=k.state.pointShadowMatrix),G.lightProbeGrid=b.state.lightProbeGridArray.length>0,G.currentProgram=Ne,G.uniformsList=null,Ne}function sc(A){if(A.uniformsList===null){let U=A.currentProgram.getUniforms();A.uniformsList=Or.seqWithValue(U.seq,A.uniforms)}return A.uniformsList}function lc(A,U){let W=V.get(A);W.outputColorSpace=U.outputColorSpace,W.batching=U.batching,W.batchingColor=U.batchingColor,W.instancing=U.instancing,W.instancingColor=U.instancingColor,W.instancingMorph=U.instancingMorph,W.skinning=U.skinning,W.morphTargets=U.morphTargets,W.morphNormals=U.morphNormals,W.morphColors=U.morphColors,W.morphTargetsCount=U.morphTargetsCount,W.numClippingPlanes=U.numClippingPlanes,W.numIntersection=U.numClipIntersection,W.vertexAlphas=U.vertexAlphas,W.vertexTangents=U.vertexTangents,W.toneMapping=U.toneMapping}function Mp(A,U){if(A.length===0)return null;if(A.length===1)return A[0].texture!==null?A[0]:null;g.setFromMatrixPosition(U.matrixWorld);for(let W=0,G=A.length;W<G;W++){let k=A[W];if(k.texture!==null&&k.boundingBox.containsPoint(g))return k}return null}function Tp(A,U,W,G,k){U.isScene!==!0&&(U=Bt),Y.resetTextureUnits();let de=U.fog,me=G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial?U.environment:null,ue=X===null?y.outputColorSpace:X.isXRRenderTarget===!0?X.texture.colorSpace:ct.workingColorSpace,ve=G.isMeshStandardMaterial||G.isMeshLambertMaterial&&!G.envMap||G.isMeshPhongMaterial&&!G.envMap,Te=re.get(G.envMap||me,ve),De=G.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Ne=!!W.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),Se=!!W.morphAttributes.position,Ke=!!W.morphAttributes.normal,vt=!!W.morphAttributes.color,st=ln;G.toneMapped&&(X===null||X.isXRRenderTarget===!0)&&(st=y.toneMapping);let et=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,Ut=et!==void 0?et.length:0,pe=V.get(G),Ot=b.state.lights;if(Xe===!0&&(nt===!0||A!==j)){let ot=A===j&&G.id===$;we.setState(G,A,ot)}let ke=!1;G.version===pe.__version?(pe.needsLights&&pe.lightsStateVersion!==Ot.state.version||pe.outputColorSpace!==ue||k.isBatchedMesh&&pe.batching===!1||!k.isBatchedMesh&&pe.batching===!0||k.isBatchedMesh&&pe.batchingColor===!0&&k._colorsTexture===null||k.isBatchedMesh&&pe.batchingColor===!1&&k._colorsTexture!==null||k.isInstancedMesh&&pe.instancing===!1||!k.isInstancedMesh&&pe.instancing===!0||k.isSkinnedMesh&&pe.skinning===!1||!k.isSkinnedMesh&&pe.skinning===!0||k.isInstancedMesh&&pe.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&pe.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&pe.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&pe.instancingMorph===!1&&k.morphTexture!==null||pe.envMap!==Te||G.fog===!0&&pe.fog!==de||pe.numClippingPlanes!==void 0&&(pe.numClippingPlanes!==we.numPlanes||pe.numIntersection!==we.numIntersection)||pe.vertexAlphas!==De||pe.vertexTangents!==Ne||pe.morphTargets!==Se||pe.morphNormals!==Ke||pe.morphColors!==vt||pe.toneMapping!==st||pe.morphTargetsCount!==Ut||!!pe.lightProbeGrid!=b.state.lightProbeGridArray.length>0)&&(ke=!0):(ke=!0,pe.__version=G.version);let Kt=pe.currentProgram;ke===!0&&(Kt=zo(G,U,k),D&&G.isNodeMaterial&&D.onUpdateProgram(G,Kt,pe));let _n=!1,In=!1,xr=!1,Qe=Kt.getUniforms(),gt=pe.uniforms;if(x.useProgram(Kt.program)&&(_n=!0,In=!0,xr=!0),G.id!==$&&($=G.id,In=!0),pe.needsLights){let ot=Mp(b.state.lightProbeGridArray,k);pe.lightProbeGrid!==ot&&(pe.lightProbeGrid=ot,In=!0)}if(_n||j!==A){x.buffers.depth.getReversed()&&A.reversedDepth!==!0&&(A._reversedDepth=!0,A.updateProjectionMatrix()),Qe.setValue(O,"projectionMatrix",A.projectionMatrix),Qe.setValue(O,"viewMatrix",A.matrixWorldInverse);let On=Qe.map.cameraPosition;On!==void 0&&On.setValue(O,lt.setFromMatrixPosition(A.matrixWorld)),C.logarithmicDepthBuffer&&Qe.setValue(O,"logDepthBufFC",2/(Math.log(A.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&Qe.setValue(O,"isOrthographic",A.isOrthographicCamera===!0),j!==A&&(j=A,In=!0,xr=!0)}if(pe.needsLights&&(Ot.state.sunShadowMap.length>0&&Qe.setValue(O,"sunShadowMap",Ot.state.sunShadowMap,Y),Ot.state.directionalShadowMap.length>0&&Qe.setValue(O,"directionalShadowMap",Ot.state.directionalShadowMap,Y),Ot.state.spotShadowMap.length>0&&Qe.setValue(O,"spotShadowMap",Ot.state.spotShadowMap,Y),Ot.state.pointShadowMap.length>0&&Qe.setValue(O,"pointShadowMap",Ot.state.pointShadowMap,Y)),k.isSkinnedMesh){Qe.setOptional(O,k,"bindMatrix"),Qe.setOptional(O,k,"bindMatrixInverse");let ot=k.skeleton;ot&&(ot.boneTexture===null&&ot.computeBoneTexture(),Qe.setValue(O,"boneTexture",ot.boneTexture,Y))}k.isBatchedMesh&&(Qe.setOptional(O,k,"batchingTexture"),Qe.setValue(O,"batchingTexture",k._matricesTexture,Y),Qe.setOptional(O,k,"batchingIdTexture"),Qe.setValue(O,"batchingIdTexture",k._indirectTexture,Y),Qe.setOptional(O,k,"batchingColorTexture"),k._colorsTexture!==null&&Qe.setValue(O,"batchingColorTexture",k._colorsTexture,Y));let Nn=W.morphAttributes;if((Nn.position!==void 0||Nn.normal!==void 0||Nn.color!==void 0)&&N.update(k,W,Kt),(In||pe.receiveShadow!==k.receiveShadow)&&(pe.receiveShadow=k.receiveShadow,Qe.setValue(O,"receiveShadow",k.receiveShadow)),(G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial)&&G.envMap===null&&U.environment!==null&&(gt.envMapIntensity.value=U.environmentIntensity),gt.dfgLUT!==void 0&&(gt.dfgLUT.value=Sv()),In){if(Qe.setValue(O,"toneMappingExposure",y.toneMappingExposure),pe.needsLights&&bp(gt,xr),de&&G.fog===!0&&be.refreshFogUniforms(gt,de),be.refreshMaterialUniforms(gt,G,J,q,b.state.transmissionRenderTarget[A.id]),pe.needsLights&&pe.lightProbeGrid){let ot=pe.lightProbeGrid;gt.probesSH.value=ot.texture,gt.probesMin.value.copy(ot.boundingBox.min),gt.probesMax.value.copy(ot.boundingBox.max),gt.probesResolution.value.copy(ot.resolution)}Or.upload(O,sc(pe),gt,Y)}if(G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&(Or.upload(O,sc(pe),gt,Y),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&Qe.setValue(O,"center",k.center),Qe.setValue(O,"modelViewMatrix",k.modelViewMatrix),Qe.setValue(O,"normalMatrix",k.normalMatrix),Qe.setValue(O,"modelMatrix",k.matrixWorld),G.uniformsGroups!==void 0){let ot=G.uniformsGroups;for(let On=0,Er=ot.length;On<Er;On++){let fc=ot[On];te.update(fc,Kt),te.bind(fc,Kt)}}return Kt}function bp(A,U){A.ambientLightColor.needsUpdate=U,A.lightProbe.needsUpdate=U,A.sunLights.needsUpdate=U,A.sunLightShadows.needsUpdate=U,A.directionalLights.needsUpdate=U,A.directionalLightShadows.needsUpdate=U,A.pointLights.needsUpdate=U,A.pointLightShadows.needsUpdate=U,A.spotLights.needsUpdate=U,A.spotLightShadows.needsUpdate=U,A.rectAreaLights.needsUpdate=U,A.hemisphereLights.needsUpdate=U}function wp(A){return A.isMeshLambertMaterial||A.isMeshToonMaterial||A.isMeshPhongMaterial||A.isMeshStandardMaterial||A.isShadowMaterial||A.isShaderMaterial&&A.lights===!0}this.getActiveCubeFace=function(){return z},this.getActiveMipmapLevel=function(){return F},this.getRenderTarget=function(){return X},this.setRenderTargetTextures=function(A,U,W){let G=V.get(A);G.__autoAllocateDepthBuffer=A.resolveDepthBuffer===!1,G.__autoAllocateDepthBuffer===!1&&(G.__useRenderToTexture=!1),V.get(A.texture).__webglTexture=U,V.get(A.depthTexture).__webglTexture=G.__autoAllocateDepthBuffer?void 0:W,G.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(A,U){let W=V.get(A);W.__webglFramebuffer=U,W.__useDefaultFramebuffer=U===void 0},this.setRenderTarget=function(A,U=0,W=0){X=A,z=U,F=W;let G=null,k=!1,de=!1;if(A){let ue=V.get(A);if(ue.__useDefaultFramebuffer!==void 0){x.bindFramebuffer(O.FRAMEBUFFER,ue.__webglFramebuffer),Z.copy(A.viewport),ge.copy(A.scissor),Ee=A.scissorTest,x.viewport(Z),x.scissor(ge),x.setScissorTest(Ee),$=-1;return}else if(ue.__webglFramebuffer===void 0)Y.setupRenderTarget(A);else if(ue.__hasExternalTextures)Y.rebindTextures(A,V.get(A.texture).__webglTexture,V.get(A.depthTexture).__webglTexture);else if(A.depthBuffer){let De=A.depthTexture;if(ue.__boundDepthTexture!==De){if(De!==null&&V.has(De)&&(A.width!==De.image.width||A.height!==De.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Y.setupDepthRenderbuffer(A)}}let ve=A.texture;(ve.isData3DTexture||ve.isDataArrayTexture||ve.isCompressedArrayTexture)&&(de=!0);let Te=V.get(A).__webglFramebuffer;A.isWebGLCubeRenderTarget?(Array.isArray(Te[U])?G=Te[U][W]:G=Te[U],k=!0):A.samples>0&&Y.useMultisampledRTT(A)===!1?G=V.get(A).__webglMultisampledFramebuffer:Array.isArray(Te)?G=Te[W]:G=Te,Z.copy(A.viewport),ge.copy(A.scissor),Ee=A.scissorTest}else Z.copy(_e).multiplyScalar(J).floor(),ge.copy(Be).multiplyScalar(J).floor(),Ee=Mt;if(W!==0&&(G=I),x.bindFramebuffer(O.FRAMEBUFFER,G)&&x.drawBuffers(A,G),x.viewport(Z),x.scissor(ge),x.setScissorTest(Ee),k){let ue=V.get(A.texture);O.framebufferTexture2D(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_CUBE_MAP_POSITIVE_X+U,ue.__webglTexture,W)}else if(de){let ue=U;for(let ve=0;ve<A.textures.length;ve++){let Te=V.get(A.textures[ve]);O.framebufferTextureLayer(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0+ve,Te.__webglTexture,W,ue)}}else if(A!==null&&W!==0){let ue=V.get(A.texture);O.framebufferTexture2D(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_2D,ue.__webglTexture,W)}$=-1};function cc(A){let U=V.get(A);return(U.__readFormat!==A.format||U.__readType!==A.type)&&(U.__readFormat=A.format,U.__readType=A.type,U.__formatReadable=C.textureFormatReadable(A.format),U.__typeReadable=C.textureTypeReadable(A.type)),U}this.readRenderTargetPixels=function(A,U,W,G,k,de,me,ue=0){if(!(A&&A.isWebGLRenderTarget)){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ve=V.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&me!==void 0&&(ve=ve[me]),ve){x.bindFramebuffer(O.FRAMEBUFFER,ve);try{let Te=A.textures[ue],De=Te.format,Ne=Te.type;A.textures.length>1&&O.readBuffer(O.COLOR_ATTACHMENT0+ue);let Se=cc(Te);if(Se.__formatReadable===!1){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Se.__typeReadable===!1){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=A.width-G&&W>=0&&W<=A.height-k&&O.readPixels(U,W,G,k,le.convert(De),le.convert(Ne),de)}finally{let Te=X!==null?V.get(X).__webglFramebuffer:null;x.bindFramebuffer(O.FRAMEBUFFER,Te)}}},this.readRenderTargetPixelsAsync=async function(A,U,W,G,k,de,me,ue=0){if(!(A&&A.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ve=V.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&me!==void 0&&(ve=ve[me]),ve)if(U>=0&&U<=A.width-G&&W>=0&&W<=A.height-k){x.bindFramebuffer(O.FRAMEBUFFER,ve);let Te=A.textures[ue],De=Te.format,Ne=Te.type;A.textures.length>1&&O.readBuffer(O.COLOR_ATTACHMENT0+ue);let Se=cc(Te);if(Se.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Se.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ke=O.createBuffer();O.bindBuffer(O.PIXEL_PACK_BUFFER,Ke),O.bufferData(O.PIXEL_PACK_BUFFER,de.byteLength,O.STREAM_READ),O.readPixels(U,W,G,k,le.convert(De),le.convert(Ne),0),O.bindBuffer(O.PIXEL_PACK_BUFFER,null);let vt=X!==null?V.get(X).__webglFramebuffer:null;x.bindFramebuffer(O.FRAMEBUFFER,vt);let st=O.fenceSync(O.SYNC_GPU_COMMANDS_COMPLETE,0);return O.flush(),await Rf(O,st,4),O.bindBuffer(O.PIXEL_PACK_BUFFER,Ke),O.getBufferSubData(O.PIXEL_PACK_BUFFER,0,de),O.bindBuffer(O.PIXEL_PACK_BUFFER,null),O.deleteBuffer(Ke),O.deleteSync(st),de}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(A,U=null,W=0){let G=Math.pow(2,-W),k=Math.floor(A.image.width*G),de=Math.floor(A.image.height*G),me=U!==null?U.x:0,ue=U!==null?U.y:0;Y.setTexture2D(A,0),O.copyTexSubImage2D(O.TEXTURE_2D,W,0,0,me,ue,k,de),x.unbindTexture()},this.copyTextureToTexture=function(A,U,W=null,G=null,k=0,de=0){let me,ue,ve,Te,De,Ne,Se,Ke,vt,st=A.isCompressedTexture?A.mipmaps[de]:A.image;if(W!==null)me=W.max.x-W.min.x,ue=W.max.y-W.min.y,ve=W.isBox3?W.max.z-W.min.z:1,Te=W.min.x,De=W.min.y,Ne=W.isBox3?W.min.z:0;else{let gt=Math.pow(2,-k);me=Math.floor(st.width*gt),ue=Math.floor(st.height*gt),A.isDataArrayTexture?ve=st.depth:A.isData3DTexture?ve=Math.floor(st.depth*gt):ve=1,Te=0,De=0,Ne=0}G!==null?(Se=G.x,Ke=G.y,vt=G.z):(Se=0,Ke=0,vt=0);let et=le.convert(U.format),Ut=le.convert(U.type),pe;U.isData3DTexture?(Y.setTexture3D(U,0),pe=O.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?(Y.setTexture2DArray(U,0),pe=O.TEXTURE_2D_ARRAY):(Y.setTexture2D(U,0),pe=O.TEXTURE_2D),x.activeTexture(O.TEXTURE0),x.pixelStorei(O.UNPACK_FLIP_Y_WEBGL,U.flipY),x.pixelStorei(O.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),x.pixelStorei(O.UNPACK_ALIGNMENT,U.unpackAlignment);let Ot=x.getParameter(O.UNPACK_ROW_LENGTH),ke=x.getParameter(O.UNPACK_IMAGE_HEIGHT),Kt=x.getParameter(O.UNPACK_SKIP_PIXELS),_n=x.getParameter(O.UNPACK_SKIP_ROWS),In=x.getParameter(O.UNPACK_SKIP_IMAGES);x.pixelStorei(O.UNPACK_ROW_LENGTH,st.width),x.pixelStorei(O.UNPACK_IMAGE_HEIGHT,st.height),x.pixelStorei(O.UNPACK_SKIP_PIXELS,Te),x.pixelStorei(O.UNPACK_SKIP_ROWS,De),x.pixelStorei(O.UNPACK_SKIP_IMAGES,Ne);let xr=A.isDataArrayTexture||A.isData3DTexture,Qe=U.isDataArrayTexture||U.isData3DTexture;if(A.isDepthTexture){let gt=V.get(A),Nn=V.get(U),ot=V.get(gt.__renderTarget),On=V.get(Nn.__renderTarget);x.bindFramebuffer(O.READ_FRAMEBUFFER,ot.__webglFramebuffer),x.bindFramebuffer(O.DRAW_FRAMEBUFFER,On.__webglFramebuffer);for(let Er=0;Er<ve;Er++)xr&&(O.framebufferTextureLayer(O.READ_FRAMEBUFFER,O.COLOR_ATTACHMENT0,V.get(A).__webglTexture,k,Ne+Er),O.framebufferTextureLayer(O.DRAW_FRAMEBUFFER,O.COLOR_ATTACHMENT0,V.get(U).__webglTexture,de,vt+Er)),O.blitFramebuffer(Te,De,me,ue,Se,Ke,me,ue,O.DEPTH_BUFFER_BIT,O.NEAREST);x.bindFramebuffer(O.READ_FRAMEBUFFER,null),x.bindFramebuffer(O.DRAW_FRAMEBUFFER,null)}else if(k!==0||A.isRenderTargetTexture||V.has(A)){let gt=V.get(A),Nn=V.get(U);x.bindFramebuffer(O.READ_FRAMEBUFFER,L),x.bindFramebuffer(O.DRAW_FRAMEBUFFER,H);for(let ot=0;ot<ve;ot++)xr?O.framebufferTextureLayer(O.READ_FRAMEBUFFER,O.COLOR_ATTACHMENT0,gt.__webglTexture,k,Ne+ot):O.framebufferTexture2D(O.READ_FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_2D,gt.__webglTexture,k),Qe?O.framebufferTextureLayer(O.DRAW_FRAMEBUFFER,O.COLOR_ATTACHMENT0,Nn.__webglTexture,de,vt+ot):O.framebufferTexture2D(O.DRAW_FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_2D,Nn.__webglTexture,de),k!==0?O.blitFramebuffer(Te,De,me,ue,Se,Ke,me,ue,O.COLOR_BUFFER_BIT,O.NEAREST):Qe?O.copyTexSubImage3D(pe,de,Se,Ke,vt+ot,Te,De,me,ue):O.copyTexSubImage2D(pe,de,Se,Ke,Te,De,me,ue);x.bindFramebuffer(O.READ_FRAMEBUFFER,null),x.bindFramebuffer(O.DRAW_FRAMEBUFFER,null)}else Qe?A.isDataTexture||A.isData3DTexture?O.texSubImage3D(pe,de,Se,Ke,vt,me,ue,ve,et,Ut,st.data):U.isCompressedArrayTexture?O.compressedTexSubImage3D(pe,de,Se,Ke,vt,me,ue,ve,et,st.data):O.texSubImage3D(pe,de,Se,Ke,vt,me,ue,ve,et,Ut,st):A.isDataTexture?O.texSubImage2D(O.TEXTURE_2D,de,Se,Ke,me,ue,et,Ut,st.data):A.isCompressedTexture?O.compressedTexSubImage2D(O.TEXTURE_2D,de,Se,Ke,st.width,st.height,et,st.data):O.texSubImage2D(O.TEXTURE_2D,de,Se,Ke,me,ue,et,Ut,st);x.pixelStorei(O.UNPACK_ROW_LENGTH,Ot),x.pixelStorei(O.UNPACK_IMAGE_HEIGHT,ke),x.pixelStorei(O.UNPACK_SKIP_PIXELS,Kt),x.pixelStorei(O.UNPACK_SKIP_ROWS,_n),x.pixelStorei(O.UNPACK_SKIP_IMAGES,In),de===0&&U.generateMipmaps&&O.generateMipmap(pe),x.unbindTexture()},this.initRenderTarget=function(A){V.get(A).__webglFramebuffer===void 0&&Y.setupRenderTarget(A)},this.initTexture=function(A){A.isCubeTexture?Y.setTextureCube(A,0):A.isData3DTexture?Y.setTexture3D(A,0):A.isDataArrayTexture||A.isCompressedArrayTexture?Y.setTexture2DArray(A,0):Y.setTexture2D(A,0),x.unbindTexture()},this.resetState=function(){z=0,F=0,X=null,x.reset(),he.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ss}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(n){this._outputColorSpace=n;let t=this.getContext();t.drawingBufferColorSpace=ct._getDrawingBufferColorSpace(n),t.unpackColorSpace=ct._getUnpackColorSpace()}};var xv=120,Ev=.6,Pu=e=>{let n=Ts(pt.fog);return Ts(e).map((t,r)=>t/n[r])},yu=e=>`vec3(${e.map(n=>n.toFixed(4)).join(", ")})`,Mv=Pu(pt.hazeSun),Tv=Pu(pt.hazeShade),Lu=`
vec3 hazeTint( vec3 fogCol, vec3 dir ) {
  float toSun = dot( dir, hazeSunDir ) * 0.5 + 0.5;
  return fogCol * mix( ${yu(Tv)}, ${yu(Mv)}, toSun * toSun );
}
`,Du="uniform vec3 hazeSunDir;",bv=`
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogRay;
#endif
`,wv=`
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  // From the camera to here, in world directions (the view's rotation undone).
  vFogRay = ( vec4( mvPosition.xyz, 0.0 ) * viewMatrix ).xyz;
#endif
`;function Av(){return`
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
  ${Du}
  ${Lu}
#endif
`}var Rv=`
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
  float hazeThin = 1.0 - ${Ev.toFixed(3)} * ( 1.0 - exp2( - hazeY / ${xv.toFixed(1)} ) );
  float hazeD = hazeDensity * hazeThin * hazeDist;
  float fogFactor = 1.0 - exp( - hazeD * hazeD );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, hazeTint( fogColor, hazeDir ), fogFactor );
#endif
`,_i=null;function kw(e){if(!_i){_i=e.clone().normalize(),Ce.fog_pars_vertex=bv,Ce.fog_vertex=wv,Ce.fog_pars_fragment=Av(),Ce.fog_fragment=Rv;for(let n of[...Object.values(Jt??{}).map(t=>t?.uniforms),ce?.fog])n?.fogColor&&(n.hazeSunDir={value:_i.clone()})}}var Vw=()=>_i;function zw(){return`${Du}
${Lu}`}var Ww=e=>({value:e.clone().normalize()}),Xw=.5,xo=1,Gs=new Set;function $w(e){xo=e;for(let n of Gs){let t=n.deref();t?t.setHaze(t.times,t.readable):Gs.delete(n)}}var Cu=class e extends fs{constructor(n,t){super(n,t*xo,t*xo),this.isHazeFog=!0,this.fair=t,this.times=1,this.readable=1,Gs.add(new WeakRef(this))}setHaze(n,t=1){this.times=n,this.readable=t,this.near=this.fair*n*xo,this.far=this.fair*Math.min(n,t)*xo}get density(){return this.near}clone(){return new e(this.color,this.fair)}};var tn=["standard","medium","high","ultra"],It={standard:"Very low",medium:"Low",high:"Standard",ultra:"Medium"},yv={standard:"Standard",medium:"Medium",high:"High",ultra:"Ultra"};function Kw(e,n){let t=e?.setting??e?.level;return n||!tn.includes(t)?"":`The graphics settings have new names - your ${yv[t]} is now called ${It[t]}, the same picture. Very low, Low, Standard and Medium today; a new High and Ultra come later.`}var Cv="medium",ks=tn.at(-1),or=e=>tn.indexOf(e),Br=(e,n)=>or(e)>or(n),Hr=e=>tn.includes(e);function Gn(e={}){let n=e&&typeof e=="object"?e:{},t=n.level==="standard"?"standard":n.level===void 0?null:"medium",r=Hr(n.highest)?n.highest:ks,o=Hr(n.setting)?n.setting:t??Cv;return Br(o,r)&&(o=r),{setting:o,highest:r,fixed:n.fixed===!0||n.valve===!1}}function Eo(e,{setting:n,highest:t,fixed:r}){let o={...e&&typeof e=="object"?e:{},setting:n,highest:t===ks?null:t,fixed:!!r};return o.level=n==="standard"?"standard":"high",o}function Mo(e,n){let t=Gn(e);return Hr(n)?Eo(e,{...t,setting:n,highest:Br(n,t.highest)?n:t.highest}):Eo(e,t)}function qw(e,n){let t=Gn(e);return Hr(n)?Eo(e,{...t,highest:n,setting:Br(t.setting,n)?n:t.setting}):Eo(e,t)}function Zw(e,n){return Eo(e,{...Gn(e),fixed:!!n})}function Uu(e,n=ks){let t=or(e);return t<0||t>=or(n)?tn[0]:tn[t+1]}function Iu(e,n){let t=o=>o.first?100:o.of==="effects"?99:o.of==="picture"?-1:or(o.of),r=o=>o.of==="picture"||o.of==="effects"||o.of!=="standard"&&Hr(o.of)&&!Br(o.of,e);return n.filter(r).sort((o,i)=>t(i)-t(o)||o.order-i.order)}function jw({built:e,steps:n=[],shed:t=0,scale:r=1}){let o=Pv({built:e,steps:n,shed:t}),i=n.slice(0,t).some(s=>s.of===o),a=`${It[e]??e}${o!==e?` \u2192 ${It[o]}`:""}${i?" (reduced)":""}`;return r<1?`${a}, picture ${Math.round(r*100)}%`:a}function Pv({built:e,steps:n=[],shed:t=0}){let r=n.slice(0,t),o=e;for(;Br(o,"medium");){let i=n.filter(a=>a.of===o);if(!i.length||!i.every(a=>r.includes(a)))break;o=tn[or(o)-1]}return o}function Qw(e,n){return e.filter(t=>t.of!=="picture"&&Br(t.of,n)).length}function Jw(e,n){if(!Number.isInteger(n)||n<1||n>e.length)return null;let t=e[n-1];if(t.of==="picture"||!Hr(t.of)||e.filter(i=>i.of===t.of).at(-1)!==t)return null;let o=tn[or(t.of)-1];return o&&o!=="standard"?{upper:t.of,lower:o}:null}function e1({upper:e,lower:n}){return`The graphics keep switching between ${It[e]} and ${It[n]} on this PC. Make ${It[n]} the highest setting?`}function t1({built:e,fixed:n=!1,spent:t=!0,next:r="standard"}){return n?"slow picture":e==="standard"||!t?"":r==="standard"?`G for ${It.standard}`:`${It.standard} in the menu`}function n1({upper:e,lower:n}){return`Kept switching ${It[e]} \u2194 ${It[n]}: ${It[n]} as the highest setting would suit this PC`}var Lv=1800*1e3;function Nu(e,n=null,t=Date.now(),r=""){let o=e??{},i="",a=new URLSearchParams(r).get("graphics");if(tn.includes(a))o=Mo(o,a),i=`Started on ${It[a]} graphics - G changes it`;else{let l=Gn(o),c=n&&typeof n=="object"&&n.setting===l.setting&&Number.isFinite(n.at)&&t-n.at>=0&&t-n.at<Lv,f=tn[tn.indexOf(l.setting)-1];c&&f&&(o={...Mo(o,f),highest:o?.highest??null},i=`${It[l.setting]} didn't finish starting last time on this PC - started on ${It[f]}. G to try ${It[l.setting]} again`)}let s=Gn(o).setting;return{graphics:o,setting:s,changed:o!==e,note:{setting:s,at:t},message:i}}var To=Nu(Gt("graphics",{}),Gt("startGuard",null),Date.now(),typeof location>"u"?"":location.search);To.changed&&io("graphics",To.graphics);io("startGuard",To.note);if(typeof location<"u"&&/[?&]graphics=/.test(location.search)){let e=new URL(location.href);e.searchParams.delete("graphics"),history.replaceState(history.state,"",e)}var c1=To.message;function f1(){io("startGuard",null)}var ft=To.setting,Pe=ft!=="standard",Pt=ft==="high"||ft==="ultra",wt=ft==="ultra",Nt=typeof window<"u"&&!!window.pocket;function Dv(){return Gn(Gt("graphics",{}))}function u1(){let e=Dv();return Uu(e.setting,e.highest)}function d1(e){io("graphics",Mo(Gt("graphics",{}),e)),location.reload()}var vi={ultra:300,high:300,medium:220,standard:150,least:100},Fu=20,Uv=.6;function Hu(e,n=Uv){return Object.fromEntries(Object.entries(e).map(([t,r])=>[t,typeof r=="number"?Math.round(r*n):r]))}var Vs={ultra:120,high:45},Iv=10,Bu={ultra:120,high:140},Gu={ultra:40,high:36},ku={ultra:!0},Vu={ultra:!0,high:!0},Ou={bin:25,band:12};function Nv(e,n,{bin:t=Ou.bin,band:r=Ou.band}={}){let o=new Uint8Array(e.length);if(!n?.length||!e.length)return o;let i=e.map(([l,c])=>{let f={d:1/0,s:0,side:1},u=0;for(let d=0;d<Math.max(1,n.length-1);d++){let[h,_]=n[d],[T,m]=n[d+1]??n[d],p=T-h,S=m-_,M=Math.hypot(p,S),g=M>0?Math.max(0,Math.min(1,((l-h)*p+(c-_)*S)/(M*M))):0,E=h+p*g,b=_+S*g,R=Math.hypot(l-E,c-b);R<f.d&&(f={d:R,s:u+M*g,side:p*(c-_)-S*(l-h)>=0?1:-1}),u+=M}return f}),a=new Map,s=(l,c)=>`${l}:${c}`;for(let l of i){let c=s(l.side,Math.floor(l.s/t));a.set(c,Math.min(a.get(c)??1/0,l.d))}return i.forEach((l,c)=>{let f=Math.floor(l.s/t),u=1/0;for(let d of[f-1,f,f+1])u=Math.min(u,a.get(s(l.side,d))??1/0);l.d<=u+r&&(o[c]=1)}),o}var Ov=19;function zu(e,[n,t],r,{distance:o=Vs.high,give:i=Iv,front:a=null,frontDistance:s=0,max:l=1/0,always:c=null,ahead:f=null,behind:u=Ov}={}){let d=f?.dir?Math.hypot(f.dir[0],f.dir[1]):0,[h,_]=d>1e-6?[f.dir[0]/d,f.dir[1]/d]:[0,0],T=[],m=e.length/2,p=new Uint8Array(m),S=[];for(let M=0;M<m;M++){if(c?.[M]){p[M]=1;continue}let g=Math.hypot(e[M*2]-n,e[M*2+1]-t),E=r[M]===1;if(d>1e-6){let v=(e[M*2]-n)*h+(e[M*2+1]-t)*_;if(E?v<-u-i/2:v<-u+i/2)continue}let b=a?.[M]?Math.max(o,s):o;b>0&&(E?g<=b+i/2:g<b-i/2)&&(p[M]=1,b>o&&!(E?g<=o+i/2:g<o-i/2)&&S.push([g,M]))}if(S.length>l){S.sort((M,g)=>M[0]-g[0]);for(let[,M]of S.slice(Math.max(0,l)))p[M]=0}for(let M=0;M<m;M++)r[M]===1!=(p[M]===1)&&(r[M]=p[M],T.push(M));return T}function zs(e,{far:n=!1,close:t=!1,boughs:r=!0}={},{nearOnly:o=!1,plain:i=!1,worn:a=!1}={}){return e==="far"?n:n?!1:e==="limbs"||e==="cardsClose"||e==="core"?t:i?!t&&!r:a?e==="cards"?!t&&r:t||r:e==="cards"||o?!t:!0}var Mn={on:{high:!0},sides:6,toward:1,spread:60,reach:3,least:14,cover:.8,near:40,give:10};function Wu(e,{facing:n=null,sides:t=Mn.sides,toward:r=Mn.toward,spread:o=Mn.spread,reach:i=Mn.reach,least:a=Mn.least,cover:s=Mn.cover}={}){let l=e.length/4,c=new Uint8Array(l),f=a;for(let S=0;S<l;S++)f=Math.max(f,e[S*4+3]*i);let u=f,d=new Map,h=(S,M)=>S*73856093+M*19349663;for(let S=0;S<l;S++){let M=h(Math.floor(e[S*4]/u),Math.floor(e[S*4+1]/u));d.has(M)?d.get(M).push(S):d.set(M,[S])}let _=n?.length?n:null,T=o*Math.PI/180,m=_?r:t,p=_?Nv(Array.from({length:l},(S,M)=>[e[M*4],e[M*4+1]]),_):null;for(let S=0;S<l;S++){if(p?.[S])continue;let[M,g,E,b]=[e[S*4],e[S*4+1],e[S*4+2],e[S*4+3]],R=Math.max(a,b*i),v=_?Fv(M,g,_):null,w=v?Math.atan2(v[1]-g,v[0]-M):0;if(v&&Math.hypot(v[0]-M,v[1]-g)<1e-6)continue;let y=new Uint8Array(m),P=0,D=Math.floor(M/u),I=Math.floor(g/u);for(let L=D-1;L<=D+1&&P<m;L++)for(let H=I-1;H<=I+1&&P<m;H++)for(let z of d.get(h(L,H))??[]){if(z===S||e[z*4+2]<E*s)continue;let F=e[z*4]-M,X=e[z*4+1]-g,$=Math.hypot(F,X);if($>R||$===0)continue;let j;if(_){let Z=Math.atan2(Math.sin(Math.atan2(X,F)-w),Math.cos(Math.atan2(X,F)-w));if(Math.abs(Z)>T)continue;j=Math.min(m-1,Math.floor((Z+T)/(2*T)*m))}else j=Math.floor((Math.atan2(X,F)+Math.PI)/(Math.PI*2)*t)%t;y[j]||(y[j]=1,P++)}P===m&&(c[S]=1)}return c}function Fv(e,n,t){let r=null,o=1/0;for(let i=0;i<t.length;i++){let[a,s]=t[i],[l,c]=t[i+1]??t[i],f=l-a,u=c-s,d=f*f+u*u,h=d>0?Math.max(0,Math.min(1,((e-a)*f+(n-s)*u)/d)):0,_=a+f*h,T=s+u*h,m=(e-_)**2+(n-T)**2;m<o&&([r,o]=[[_,T],m])}return r}function Xu(e,n,t,r,{near:o=Mn.near,give:i=Mn.give}={}){let a=[];n=(n??[]).filter(l=>l?.length);let s=e.length/2;for(let l=0;l<s;l++){if(!t[l])continue;let c=1/0;for(let d of n)c=Math.min(c,$u(e[l*2],e[l*2+1],d));let f=r[l]===1,u=f?c<=o+i/2:c<o-i/2;u!==f&&(r[l]=u?1:0,a.push(l))}return a}function $u(e,n,t){let r=1/0;for(let o=0;o<t.length;o++){let[i,a]=t[o],s=t[o+1],l;if(!s)l=(e-i)**2+(n-a)**2;else{let[c,f]=s,u=c-i,d=f-a,h=u*u+d*d,_=h>0?Math.max(0,Math.min(1,((e-i)*u+(n-a)*d)/h)):0;l=(e-i-u*_)**2+(n-a-d*_)**2}l<r&&(r=l)}return Math.sqrt(r)}function Yu(e,n,t,{distance:r=vi.medium,hysteresis:o=Fu,never:i=null}={}){let a=[];if(n=(n??[]).filter(f=>f?.length),!n.length)return a;let s=r+o/2,l=r-o/2,c=e.length/2;for(let f=0;f<c;f++){let u=t[f]===1,d=!1;if(!i?.[f]){let h=1/0;for(let _ of n)h=Math.min(h,$u(e[f*2],e[f*2+1],_));d=u?h>=l:h>s}d!==u&&(t[f]=d?1:0,a.push(f))}return a}function Ku(e,n,t,r,{distance:o=vi.medium,hysteresis:i=Fu}={}){let a=o-i,s=a*a,l=e.length/2;for(let c=0;c<l;c++){if(n[c]!==1)continue;let f=e[c*2]-t,u=e[c*2+1]-r;if(f*f+u*u<s)return!0}return!1}function qu({cut:e=!1,newPlan:n=!1,tooClose:t=!1}={}){return e||n||t}function Ws(e,n){return n?.length?Array.isArray(n[0]?.[0])?[[e],...n]:[[e],n]:[[e]]}var Xs={bark:{full:14,fade:28,depth:.05,cracks:.55,lean:1.3},leaves:{full:45,fade:72,through:.08,behind:.05,glint:.04,shade:.4}};var Gr=[{id:"grade",label:"Warm colour and vignette",cost:"light",help:"A slightly warmer colour over the whole picture with a little more contrast, and the corners a touch darker, as a camera sees it."},{id:"ao",label:"Ambient occlusion",cost:"heavy",step:"ambient occlusion",heavy:!0,help:"A soft shade where things meet the ground near you - the foot of a trunk, under a bunker's lip, along a wall - so they sit in it rather than float."},{id:"fxaa",label:"Smooth edges (FXAA)",cost:"light",help:"Smooths the jagged edges the picture's own smoothing misses: leaves, grass blades, thin flag poles."},{id:"bloom",label:"Bloom",cost:"some",step:"bloom",heavy:!0,help:"A soft glow round only the very brightest things - sun on water, the white of the ball in sunlight. Held back: nothing else glows."},{id:"sky",label:"Detailed sky",cost:"light",help:"High, thin wisps of cloud across the sky above the cumulus, and the full number of clouds. Off: a plain sky with fewer clouds."},{id:"haze",label:"Distance haze",cost:"none",help:"The air's haze, so far hills and woods fade into the sky. Off: a clearer day, the haze only right at the edge of the world."},{id:"textures",label:"Sharp ground textures",cost:"some",costWhen:"and more of the graphics card's memory",reload:!0,notOn:["standard"],help:"Grass blades and sand grains you can see on the ground near the ball, as Standard has, on Low too. A\xB2 Golf reloads to change it."},{id:"dof",label:"Blur the far distance",cost:"some",step:"the far blur",heavy:!0,help:"The far hills and woods, beyond any green, softly out of focus, as a camera focused on the hole sees them."},{id:"shafts",label:"Sun shafts and glow",cost:"heavy",costWhen:"when the sun's in the picture",step:"sun shafts",heavy:!0,notOn:["standard","medium","high"],help:"On Medium (the highest setting): rays of sunlight streaming through the leaves and round the trunks when the sun's in the picture, and a wider, softer glow round the sun's glints on water."},{id:"focus",label:"Flyover depth of field",cost:"heavy",costWhen:"only in a hole's flyover - nothing while you play",step:"flyover depth of field",heavy:!0,notOn:["standard","medium","high"],help:"On Medium (the highest setting): in a hole's flyover the camera focuses on the ball, as a film camera's would: the ball, the trees along the hole and the green ahead stay sharp, and only the grass right by the camera and the far distance go softly out of focus. Never while you're playing a shot."},{id:"taa",label:"Smooth edges over time (TAA)",cost:"some",costWhen:"in place of FXAA's",step:"smoothing over time",notOn:["standard","medium","high"],help:"On Medium (the highest setting): each frame's drawn a fraction of a pixel to one side and blended with the last few, so leaves, flag poles and far mowing stripes are smooth and never crawl. In place of FXAA while it's on."},{id:"upscale",label:"Fewer pixels, built up over time",cost:"saves",costWhen:"with Smooth edges over time on",notOn:["standard","medium","high"],help:"On Medium (the highest setting), with Smooth edges over time: the picture drawn at two-thirds of its size each way and the full-size one built up from the last few frames, each nudged a fraction of a pixel - nearly as sharp, at under half the drawing. Off: every pixel drawn every frame."},{id:"sway",label:"Camera sway",cost:"none",help:"The camera breathes very slightly, as if held, rather than standing dead still. It never moves the aim line enough to see."},{id:"evening",label:"Late-afternoon light",cost:"none",reload:!0,help:"A lower, warmer sun on the practice greens and in the Challenges: golden light, longer shadows, a warmer sky (a round and the range take their own Time of day, picked with the sky). Off: the sun higher, in the middle of the day. A\xB2 Golf reloads to change it."},{id:"hardsun",label:"Harder sunlight",cost:"none",reload:!0,help:"The sun stronger and the sky's light softer, as on a clear day: shade under a third as bright as the sun rather than half, so trees, slopes and bunker faces stand out (less so as the sun gets low, so an evening round isn't dark). Off: the softer, flatter light the game had. A\xB2 Golf reloads to change it."},{id:"grassfield",label:"Grass all over the hole",cost:"heavy",costWhen:"and a longer wait while each hole's built",reload:!0,notOn:["standard"],help:"Tufts of longer grass all over every hole's rough and long grass, as thick far out as by the ball, see-through round the ball so you can always find it. Off: tufts only by the tee and round the green. A\xB2 Golf reloads to change it."},{id:"fineleaves",label:"Finer leaves",cost:"some",costWhen:"with trees near you, and a moment longer to start",reload:!0,notOn:["standard","medium"],help:"On Standard and Medium: the trees near you drawn with more, smaller leaves - their crowns, boughs and pine sprays - so a tree close by reads as leaves, not as cards of them. Off: fewer, larger cards, as before. A\xB2 Golf reloads to change it."},{id:"clock",label:"Time of day from the clock",cost:"none",reload:!0,help:"The sun where it would be at this time of day on the practice greens and in the Challenges: low and soft in the morning, high at midday, low and golden in the evening (a round and the range take their own Time of day, picked with the sky). In place of Late-afternoon light while it's on. A\xB2 Golf reloads to change it."},{id:"seasons",label:"Seasons",cost:"none",reload:!0,help:"The course in today's season: fresher, lighter greens in spring, the usual deep green in summer, golds, coppers and reds in the broadleaves in autumn, duller grass and dead brown leaves in winter. A\xB2 Golf reloads to change it."},{id:"rainground",label:"Rain on the ground",cost:"some",costWhen:"only while it rains",notOn:["standard"],help:"While it rains, drops splashing on the grass all round you, and rings spreading on the puddles. (Ponds ring in the rain either way.)"},{id:"wetshine",label:"Reflections on wet ground",cost:"light",costWhen:"only after rain",reload:!0,notOn:["standard"],help:"After rain the grass and paths shine with the sky's light, most where you look along them. A\xB2 Golf reloads to change it."}],$s=Gr.map(e=>e.id),m1=Object.fromEntries(Gr.filter(e=>e.step).map(e=>[e.id,e.step])),Hv={saves:"less than nothing: it saves more than half the picture's drawing",none:"next to nothing (only the colours or the light change)",light:"light, about 1 to 3% of each frame",some:"some, about 4 to 8% of each frame",heavy:"heavy, about 10 to 20% of each frame"};function g1(e,n=[]){let t=Gr.find(i=>i.id===e);if(!t?.cost)return"";let r=`Typical cost: ${Hv[t.cost]}${t.costWhen?`, ${t.costWhen}`:""}.`,o=t.step?Bv(n,t.step):null;return o?`${r} Measured here: ${o.ms} ms a frame (${Math.round(o.share*100)}%) at Medium's slowest moment (the highest setting).`:r}function Bv(e,n){for(let t of Array.isArray(e)?e:[])for(let r of t?.results??[]){let o=r?.costs?.find(i=>i.name===n);if(o&&Number.isFinite(o.ms))return o}return null}var Zu=Object.fromEntries(Gr.map(e=>[e.id,e])),ju=typeof globalThis<"u"&&!!globalThis.pocket,Gv=["textures","grassfield","fineleaves","wetshine"],Ys=["default","performance"],_1={default:"Default",performance:"Performance",custom:"Your own"};function Ks(e,n=ju){return Object.fromEntries(Gr.map(t=>[t.id,e==="performance"?!t.heavy&&!(n&&Gv.includes(t.id)):!0]))}var kv=(e,n=ju)=>n||e==="standard"?"performance":"default";function Qu(e,n=null){let t=$s.filter(r=>!n||Ju(r,n));return Ys.find(r=>t.every(o=>!!e[o]===Ks(r)[o]))??"custom"}function qs(e,n="medium"){let t=e&&typeof e=="object"?e:{},r=Ks(Ys.includes(t.preset)?t.preset:kv(n)),o=t.on&&typeof t.on=="object"?t.on:{},i=Object.fromEntries($s.map(a=>[a,typeof o[a]=="boolean"?o[a]:r[a]]));return{on:i,preset:Qu(i,n)}}var Si=(e,n=null)=>({on:{...e},preset:Qu(e,n)});function v1(e,n,t,r){let{on:o}=qs(e,r);return n in Zu?Si({...o,[n]:!!t},r):Si(o,r)}function S1(e,n,t){return Ys.includes(n)?Si(Ks(n),t):Si(qs(e,t).on,t)}function x1(e,n){return Gr.some(t=>t.reload&&!!e?.[t.id]!=!!n?.[t.id])}var Ju=(e,n)=>!(Zu[e]?.notOn??[]).includes(n);function Cn(e,n){let{on:t}=qs(e,n);return Object.fromEntries($s.map(r=>[r,t[r]&&Ju(r,n)]))}var Vv=["grade","ao","fxaa","bloom","dof","shafts","focus","taa"],E1=e=>Vv.some(n=>e?.[n]);var nd="cs2",js=2600,Qs=64;function zv(e=Qs,n=8,t=11){let r=t,o=()=>(r=r*16807%2147483647)/2147483647,i=Array.from({length:n*n},o),a=(c,f)=>i[(f+n)%n*n+(c+n)%n],s=new Uint8Array(e*e),l=c=>c*c*(3-2*c);for(let c=0;c<e;c++)for(let f=0;f<e;f++){let u=f/e*n,d=c/e*n,h=Math.floor(u),_=Math.floor(d),T=l(u-h),m=l(d-_),p=a(h,_)+(a(h+1,_)-a(h,_))*T,S=a(h,_+1)+(a(h+1,_+1)-a(h,_+1))*T;s[c*e+f]=Math.round((p+(S-p)*m)*255)}return s}function Wv(){let e=new Bn(zv(),Qs,Qs,jo,Wt);return e.wrapS=e.wrapT=cn,e.magFilter=St,e.minFilter=zt,e.generateMipmaps=!0,e.needsUpdate=!0,e}var Zs=Kf({hard:Cn(Gt("effects",{}),ft).hardsun}),Xv=Zs.sun*Math.sin(Ms*Math.PI/180)/(Zs.sun*Math.sin(Ms*Math.PI/180)+Zs.sky),xi={csMap:{value:Wv()},csDrift:{value:new je},csStrength:{value:0},csLo:{value:.5}},ed=`
uniform sampler2D csMap;
uniform vec2 csDrift;
uniform float csStrength;
uniform float csLo;
`,td=`
if ( csStrength > 0.0 ) {
  float csN = texture2D( csMap, ( csWorld.xz - csDrift ) / ${js.toFixed(1)} ).r;
  float csShade = smoothstep( csLo, csLo + 0.2, csN ) * min( 0.95, csStrength / ${Xv.toFixed(4)} );
  reflectedLight.directDiffuse *= 1.0 - csShade;
  reflectedLight.directSpecular *= 1.0 - csShade;
}
`,rd=new Set;function R1(e){return rd.add(e),e}function y1(e,[n,t],r){let o=xi.csDrift.value;o.x=(o.x+n*e)%js,o.y=(o.y+t*e)%js,xi.csStrength.value=r;for(let i of rd)i(xi)}function od(e){return Object.assign(e.uniforms,xi),!td&&!ed||(e.vertexShader=e.vertexShader.replace("#include <common>",`#include <common>
varying vec3 csWorld;`).replace("#include <project_vertex>",`#include <project_vertex>
csWorld = (vec4(mvPosition.xyz, 0.0) * viewMatrix).xyz + cameraPosition;`),e.fragmentShader=e.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 csWorld;
${ed}`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
${td}`)),e}function id(e,n=!1){return n||!(e>0)?0:Math.min(1,e/28)}var Ei=[],Pn=[],kn=0;function un(e,n,t,{of:r="medium",first:o=!1}={}){let i=Ei.findIndex(a=>a.name===n);i>=0&&Ei.splice(i,1),Ei.push({order:e,name:n,apply:t,of:r,first:o}),Pn=Iu(ft,Ei)}function $v(){return Pn.length}function U1(){return Pn.map(({name:e,of:n,order:t,first:r})=>({name:e,of:n,order:t,first:r}))}function I1(){return kn}function N1(){return Pn.slice(0,kn).map(e=>e.name)}function O1(e){for(e=Math.max(0,Math.min($v(),e));kn<e;)Pn[kn++].apply(!0);for(;kn>e;)Pn[--kn].apply(!1)}function Js(e){return Pn.slice(0,kn).some(n=>n.name===e)}function F1(e,n){let t=Pn.findIndex(r=>r.name===e);return t<0||t<kn?!1:(Pn[t].apply(!!n),!0)}var ld="b1",cd={bendTime:{value:0},bendDir:{value:new je(1,0)},bendStrength:{value:0},bendSpeed:{value:2},bendFlutter:{value:Pe?1:0}},kr=e=>Number.isInteger(e)?`${e}.0`:`${e}`,jv=`
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
  float k = 6.2831853 / ${kr(160)};
  float gust = 0.85 + 0.15 * sin(along * k - bendTime * k * bendSpeed);
  float swing = sin(bendTime * rate - along * 0.09 + bendHash(floor(foot.xz * 2.0)) * 6.2831853);
  return bendStrength * gust * (${kr(.55)} + ${kr(1-.55)} * swing);
}
`,fd=`
  #if defined( USE_BATCHING )
    mat4 bM = modelMatrix * batchingMatrix;
  #elif defined( USE_INSTANCING )
    mat4 bM = modelMatrix * instanceMatrix;
  #else
    mat4 bM = modelMatrix;
  #endif`,Mi=(e="")=>`
{
  ${fd}
  vec3 bFoot = (bM * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float bH = length(bM[1].xyz) * ${kr(10)};
  float bY = max(0.0, (bM * vec4(transformed, 1.0)).y - bFoot.y);
  float bT = clamp(bY / bH, 0.0, 1.0);
  vec3 bPush = vec3(bendDir.x, 0.0, bendDir.y) * (bendWave(bFoot, 1.25) * ${kr(.02)} * bH * bT * bT);
  ${e}
  transformed += inverse(mat3(bM)) * bPush;
}
`,Qv=`
  float bF = bendHash(transformed.xz * 3.7 + transformed.y);
  bPush += vec3(sin(bendTime * 7.0 + bF * 6.2831853), 0.6 * sin(bendTime * 5.3 + bF * 12.0), cos(bendTime * 6.1 + bF * 9.0)) * (0.05 * bendStrength * bendFlutter);
`,Jv=`
  float bHang = clamp(1.0 - bY / (bH * 0.6), 0.0, 1.0);
  bPush += vec3(bendDir.x, 0.0, bendDir.y) * (bendStrength * bHang * 0.35 * (0.6 + 0.4 * sin(bendTime * 1.7 + bendHash(bFoot.xz) * 6.2831853)));
`,sd=`
{
  ${fd}
  vec3 bFoot = (bM * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float bY = max(0.0, transformed.y) * length(bM[1].xyz);
  float bRipple = 1.0 + 0.25 * sin(bendTime * 4.3 + bendHash(bFoot.xz) * 6.2831853 + transformed.x * 3.0);
  vec3 bPush = vec3(bendDir.x, 0.0, bendDir.y) * (bendWave(bFoot, 2.1) * bRipple * ${kr(.1)} * bY * bY);
  transformed += inverse(mat3(bM)) * bPush;
}
`,el={trunk:Mi(),crown:Mi(),cards:Mi(Qv),strands:Mi(Jv),tuft:sd,dressing:sd};function ud(e,n){let t=el[n]??"";return t&&(Object.assign(e.uniforms,cd),e.vertexShader=e.vertexShader.replace("#include <common>",`#include <common>
${jv}`).replace("#include <begin_vertex>",`#include <begin_vertex>
${t}`)),e}var dd=!1;un(4,"leaf flutter",e=>{dd=e});var hd=new Set;function V1(e){return hd.add(e),e}function z1(e){let n=cd;n.bendTime.value=e.time,n.bendDir.value.set(e.dir[0],e.dir[1]),n.bendStrength.value=id(e.gusting,e.still),n.bendSpeed.value=Math.max(2,(e.mph??0)*.447),n.bendFlutter.value=Pe&&!dd?1:0;for(let t of hd)t(n);return n}var pd={trunk:{near:2,far:5,least:.25},leaves:{near:.5,far:1.5,least:0}};var eS=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];var Vr=e=>Number.isInteger(e)?`${e}.0`:`${e}`;function md(e){return`{
    float stD = length(vViewPosition);
    if (stD < ${Vr(e.far)}) {
      float stT = clamp((stD - ${Vr(e.near)}) / ${Vr(e.far-e.near)}, 0.0, 1.0);
      float stCover = ${Vr(e.least)} + ${Vr(1-e.least)} * stT * stT * (3.0 - 2.0 * stT);
      const float stBayer[16] = float[16](${eS.map(Vr).join(", ")});
      ivec2 stP = ivec2(gl_FragCoord.xy) & 3;
      if (stCover <= (stBayer[stP.y * 4 + stP.x] + 0.5) / 16.0) discard;
    }
  }`}var tS={amount:.1,size:7,warm:[1.1,1,.6],spread:[.45,1.55],sizes:[.7,1.4]},gd="tp2",nS=new Set(["crown","cards","strands"]),dn=e=>Number.isInteger(e)?`${e}.0`:`${e}`,rS=`
  #if defined( USE_BATCHING )
    mat4 pM = modelMatrix * getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
  #elif defined( USE_INSTANCING )
    mat4 pM = modelMatrix * instanceMatrix;
  #else
    mat4 pM = modelMatrix;
  #endif`,oS="sin(p.x * k + s * 6.2832) * sin(p.y * k * 0.8 + s * 11.0) * sin(p.z * k + s * 17.0)",Ti={amount:[7.13,.37],size:[3.71,.61]};function _d(e,n){if(!nS.has(n)||!el[n])return e;let t=tS;return e.vertexShader=e.vertexShader.replace("#include <project_vertex>",`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
    {
      ${rS}
      vec3 pFoot = (pM * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      float s = fract(sin(dot(floor(pFoot.xz * 4.0), vec2(12.9898, 78.233))) * 43758.5453);
      vec3 p = position;
      float pA = fract(s * ${dn(Ti.amount[0])} + ${dn(Ti.amount[1])});
      float pS = fract(s * ${dn(Ti.size[0])} + ${dn(Ti.size[1])});
      float k = ${dn(2*Math.PI/t.size)} / mix(${dn(t.sizes[0])}, ${dn(t.sizes[1])}, pS);
      float pv = ${oS};
      vColor.rgb *= vec3(1.0) + ${dn(t.amount)} * mix(${dn(t.spread[0])}, ${dn(t.spread[1])}, pA) * pv * vec3(${t.warm.map(dn).join(", ")});
    }
    #endif
    #include <project_vertex>`),e}var Md="/textures/",tl=["furrowed","plates","birch","plane"],Ln=Object.fromEntries(tl.map((e,n)=>[e,n])),nl=["asphalt","concrete","gravel","wood","brick"],q1=Object.fromEntries(nl.map((e,n)=>[e,n])),Td=[191,128,128,255];function vd(){let e=new Bn(new Uint8Array(Td),1,1);return e.needsUpdate=!0,e}function Sd(e){let n=new Uint8Array(4*e);for(let r=0;r<e;r++)n.set(Td,r*4);let t=new Dr(n,1,1,e);return t.needsUpdate=!0,t}var Tn={tGrass:{value:null},tSand:{value:null},tBark:{value:null},tBuilt:{value:null}};function bd(e){return e.wrapS=e.wrapT=cn,e.anisotropy=Pt?16:8,e.colorSpace=fn,e.generateMipmaps=!0,e.minFilter=zt,e.magFilter=St,e.needsUpdate=!0,e}var xd=!1,rl=[];function bo(){if(xd||(xd=!0,Tn.tGrass.value=vd(),Tn.tSand.value=vd(),Tn.tBark.value=Sd(tl.length),Tn.tBuilt.value=Sd(nl.length),typeof document>"u"||typeof Image>"u"))return Tn;let e=new _s;for(let[n,t]of Nt?[["grass","tGrass"]]:[["grass","tGrass"],["sand","tSand"]])rl.push(new Promise(r=>e.load(`${Md}${n}.png`,o=>{Tn[t].value=bd(o),r()},void 0,()=>{console.warn(`Couldn't load the ${n} texture: the shader's own detail stays`),r()})));return Ed("bark",tl,"tBark","the trunks stay plain"),Ed("built",nl,"tBuilt","paths and walls keep their shader's own detail"),Tn}function Ed(e,n,t,r){let o=n.map(a=>{let s=new Image;return s.src=`${Md}${e}-${a}.png`,s.decode().then(()=>s)}),i=Promise.all(o).then(a=>{let s=a[0].naturalWidth,l=document.createElement("canvas");l.width=l.height=s;let c=l.getContext("2d",{willReadFrequently:!0}),f=new Uint8Array(s*s*4*a.length);a.forEach((d,h)=>{c.clearRect(0,0,s,s),c.drawImage(d,0,0,s,s),f.set(c.getImageData(0,0,s,s).data,h*s*s*4)});let u=new Dr(f,s,s,a.length);Tn[t].value=bd(u)}).catch(()=>console.warn(`Couldn't load the ${e} textures: ${r}`));rl.push(i)}function Z1(){return Promise.all(rl).then(()=>Object.values(Tn).map(e=>e.value).filter(Boolean))}var j1=`
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
`;var wd="gr13",iS="vec3(0.8, 0.95, 1.02)",zr={gWindDir:{value:[1,0]},gWindOff:{value:0},gWindK:{value:0},gWet:{value:0},gDry:{value:0},gRain:{value:0},gTime:{value:0},gFarRough:{value:[0,1,2,3]},gFarRoughK:{value:0}},aS={on:!0},sS=`
  uniform vec2 gWindDir;
  uniform float gWindOff;
  uniform float gWindK;
  uniform float gWet;
  uniform float gDry;
  uniform float gRain;
  uniform float gTime;
  uniform vec4 gFarRough;
  uniform float gFarRoughK;
`;function lS(e){let n=il(e?.wet),t=il(e?.dry)*(1-n);if(!e||e.still)return{wind:0,speed:0,dir:[1,0],wet:n,dry:t};let r=Math.max(0,e.mph??0),o=Math.min(1,Math.max(0,(r-3)/17)),i=Math.max(.6,Math.min(1.4,1+((e.gust??1)-1)*1.3)),a=Math.min(1,o*i),s=Math.max(0,e.gusting??r)*.447*.65;return{wind:a,speed:s,dir:e.dir??[1,0],wet:n,dry:t}}var il=e=>Number.isFinite(e)?Math.min(1,Math.max(0,e)):0,ol=null;function rA(e,n){let t=ol===null?0:Math.min(.25,Math.max(0,e-ol));ol=e;let r=lS(n),o=zr;o.gWindDir.value=r.dir,o.gWindOff.value+=r.speed*t,o.gWindK.value+=(r.wind-o.gWindK.value)*Math.min(1,t*1.2),o.gWindK.value<.002&&r.wind===0&&(o.gWindK.value=0),o.gWet.value=r.wet,o.gDry.value=r.dry,o.gRain.value=aS.on?il(n?.rain):0,o.gTime.value=e%600;for(let i of Ad)i(o);return r}var Ad=new Set;function oA(e){return Ad.add(e),e}var Rd=([e,n])=>[n,-e],yd=`
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
    grass = mix(grass, grass * ${iS}, min(k, 1.0) * clover);
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
`,cS=`
  ${sS}
  const vec3 G_STRAW = ${mo(pt.straw)};
  const float G_WET = ${qf.toFixed(4)};
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
`,Cd=`
  ${cS}

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
    vec3 flower = fract(h * 13.7) < 0.55 ? ${mo(pt.daisy)} : ${mo(pt.dandelion)};
    // A daisy's yellow heart.
    flower = mix(flower, ${mo(pt.dandelion)}, 1.0 - smoothstep(0.003, 0.005, r));
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
`;function Pd(e,n=.7){return`
    {
      vec3 lx = (viewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz;
      vec3 lz = (viewMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz;
      lx = normalize(lx - normal * dot(normal, lx));
      lz = normalize(lz - normal * dot(normal, lz));
      normal = normalize(normal + (lx * ${e}.x + lz * ${e}.y) * ${n.toFixed(3)});
    }`}var iA="co3",aA=`
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
`;var Ld="st1";function Dd(e,n){let t=pd[n];return t&&(e.fragmentShader=e.fragmentShader.replace("#include <alphatest_fragment>",`#include <alphatest_fragment>
${md(t)}`)),e}var Ud=!1;function uA(e){Ud=!!e}var fS=0;function nn(e,n,t={}){if(e.userData.twin={kind:n,options:t},Ud){let r=++fS,o=Object.prototype.hasOwnProperty.call(e,"customProgramCacheKey")?e.customProgramCacheKey:null;e.customProgramCacheKey=()=>`${o?o.call(e):""}#twin${r}`}return e}var uS=`${nd}-${ld}-${Ld}-${gd}`;function Vn(e,n){if(e.userData.hooks)return e;e.userData.hooks=n;let t=e.onBeforeCompile,r=Object.prototype.hasOwnProperty.call(e,"customProgramCacheKey")?e.customProgramCacheKey:null,o=t===e.constructor.prototype.onBeforeCompile||!Object.prototype.hasOwnProperty.call(e,"onBeforeCompile");return e.onBeforeCompile=(i,a)=>{o||t.call(e,i,a),ud(i,n),_d(i,n),od(i),Dd(i,e.userData.seeThrough)},e.customProgramCacheKey=()=>`${r?r.call(e):o?"":t.toString()}|${n}${e.userData.seeThrough?`+${e.userData.seeThrough}`:""}|${uS}`,o&&!e.userData.twin&&nn(e,"hooked",{kind:n}),e}var Id=Cn(Gt("effects",{}),ft).seasons?Xf(new Date):null,TA=Id,Nd=e=>e==="summer"?null:{name:e,...$f[e]},bn=Nd(Id??"summer"),Od=0;function bA({season:e="summer",upkeep:n=0}={}){bn=Nd(e),Od=Math.min(1,Math.max(-1,Number.isFinite(n)?n:0))}function al(e){return Number.isFinite(e)?e>=2?nr.share.green:e>=.75?nr.share.fairway:nr.share.rough:nr.share.rough}var Wr={h:0,s:0,l:0};function sl(e,n="grass",t=1){let r=n==="grass"?Od*t:0;if(!bn&&!r||(e.getHSL(Wr),Wr.h<.14||Wr.h>.5))return e;let o=[Wr.h,Wr.s,Wr.l];return bn&&(o=Es(o,bn[n])),r&&(o=Es(o,(r>0?nr.dry:nr.lush).map(i=>i*Math.abs(r)))),e.setHSL(o[0],o[1],o[2])}var ll=(e,n,t)=>sl(new ye(e),n,t);function dS(e,n,t,r,o,i,a,s,l){if(Math.min(e,t,o)>a+l||Math.max(e,t,o)<a-l||Math.min(n,r,i)>s+l||Math.max(n,r,i)<s-l)return!1;let c=(t-e)*(s-n)-(r-n)*(a-e),f=(o-t)*(s-r)-(i-r)*(a-t),u=(e-o)*(s-i)-(n-i)*(a-o);if(c>=0&&f>=0&&u>=0||c<=0&&f<=0&&u<=0)return!0;let d=l*l;return cl(e,n,t,r,a,s)<=d||cl(t,r,o,i,a,s)<=d||cl(o,i,e,n,a,s)<=d}function cl(e,n,t,r,o,i){let a=t-e,s=r-n,l=a*a+s*s,c=l>0?Math.max(0,Math.min(1,((o-e)*a+(i-n)*s)/l)):0,f=e+a*c-o,u=n+s*c-i;return f*f+u*u}function Fd(e,n,t,r=2){let o=Math.floor((n?n.length:e.length/3)/3),i=new Uint8Array(o),a=0;for(let s=0;s<o;s++){let l=(n?n[s*3]:s*3)*3,c=(n?n[s*3+1]:s*3+1)*3,f=(n?n[s*3+2]:s*3+2)*3;dS(e[l],e[l+2],e[c],e[c+2],e[f],e[f+2],t.x,t.z,r)&&(i[s]=1,a++)}return{near:i,count:a}}function Hd(e,n){let t=n.length,r=0;for(let a=0;a<t;a++)r+=n[a];let o=new Uint32Array((t-r)*3),i=new Uint32Array(r*3);for(let a=0,s=0,l=0;a<t;a++){let c=n[a]?i:o,f=n[a]?l:s;for(let u=0;u<3;u++)c[f+u]=e?e[a*3+u]:a*3+u;n[a]?l+=3:s+=3}return{far:o,near:i}}function Bd(e){let n=new Map,t=new Uint32Array(e.length);for(let r=0;r<e.length;r++){let o=n.get(e[r]);o===void 0&&(o=n.size,n.set(e[r],o)),t[r]=o}return{vertices:Uint32Array.from(n.keys()),index:t}}function fl(e,n,t){let r=new e.constructor(t.length*n);for(let o=0;o<t.length;o++){let i=t[o]*n;for(let a=0;a<n;a++)r[o*n+a]=e[i+a]}return r}var pS="GROUND_UNCUT";function Vd(e,n){return n&&n.r>0&&(e.userData.cupCut={x:n.x,z:n.z,r:n.r}),e}var Gd=new WeakMap;function kd(e){let n=Gd.get(e);if(n)return n;n=new e.constructor;let t=e.userData;e.userData={};try{n.copy(e)}finally{e.userData=t}return n.userData={...t},delete n.userData.cupCut,delete n.userData.twin,n.userData.uncut=!0,n.onBeforeCompile=e.onBeforeCompile,Object.prototype.hasOwnProperty.call(e,"customProgramCacheKey")&&(n.customProgramCacheKey=e.customProgramCacheKey),n.defines={...e.defines??{},[pS]:""},t.twin&&nn(n,t.twin.kind,{...t.twin.options,uncut:!0}),t.shared||n.addEventListener("dispose",()=>e.dispose()),Gd.set(e,n),n}function mS(e){let n=e.elements;return n[0]===1&&n[5]===1&&n[10]===1&&n[1]===0&&n[2]===0&&n[4]===0&&n[6]===0&&n[8]===0&&n[9]===0&&n[3]===0&&n[7]===0&&n[11]===0&&n[15]===1}function gS(e,n){let t=new xt;for(let[r,o]of Object.entries(e.attributes))t.setAttribute(r,new Ge(fl(o.array,o.itemSize,n.vertices),o.itemSize,o.normalized));return t.setIndex(new Ge(n.vertices.length>65535?n.index:Uint16Array.from(n.index),1)),t}function _S(e,n){if(e.index){let t=0;for(let r=0;r<n.length;r++)n[r]>t&&(t=n[r]);e.setIndex(new Ge(t>=65535?n:Uint16Array.from(n),1))}else for(let[t,r]of Object.entries(e.attributes))e.setAttribute(t,new Ge(fl(r.array,r.itemSize,n),r.itemSize,r.normalized))}function CA(e,n=2){let t={pieces:0,uncut:0,split:0,patch:0},r=[];e.traverse(i=>{i.isMesh&&!i.isInstancedMesh&&!i.isBatchedMesh&&!Array.isArray(i.material)&&i.material?.userData?.cupCut&&r.push(i)}),e.updateWorldMatrix(!0,!0);for(let i of[...new Set(r.map(a=>a.material))].sort((a,s)=>a.id-s.id))kd(i);let o=new Map;for(let i of r){t.pieces++;let a=i.material,s=i.geometry,l=s.attributes.position;if(!l||l.isInterleavedBufferAttribute||s.groups.length||s.drawRange.start!==0||s.drawRange.count!==1/0||Object.keys(s.morphAttributes).length||!mS(i.matrixWorld))continue;let f=a.userData.cupCut,u={x:f.x-i.matrixWorld.elements[12],z:f.z-i.matrixWorld.elements[14]},d=o.get(s);if(!d){s.boundingBox||s.computeBoundingBox();let h=s.boundingBox,T=u.x<h.min.x-n||u.x>h.max.x+n||u.z<h.min.z-n||u.z>h.max.z+n?{count:0}:Fd(l.array,s.index?.array??null,u,n);if(d={found:T,patch:null},T.count&&T.count<T.near.length&&!a.transparent){let m=Hd(s.index?.array??null,T.near);d.patch=gS(s,Bd(m.near)),_S(s,m.far),t.split++,t.patch+=T.count}o.set(s,d)}if(!(d.found.count&&!d.patch)){if(d.patch){let h=new Rt(d.patch,a);h.name=i.name?`${i.name} (round the cup)`:"round the cup";for(let T of["castShadow","receiveShadow","renderOrder","frustumCulled","visible","matrixAutoUpdate","customDepthMaterial","customDistanceMaterial"])h[T]=i[T];h.layers.mask=i.layers.mask,h.position.copy(i.position),h.quaternion.copy(i.quaternion),h.scale.copy(i.scale),h.userData={...i.userData},delete h.userData.keepGeometry;let _=i.parent;_.add(h),_.children.splice(_.children.indexOf(h),1),_.children.splice(_.children.indexOf(i)+1,0,h),h.updateMatrixWorld(!0)}i.material=kd(a),t.uncut++}}return t}function bi(e){let n=e.length,t=0;for(let r=0;r<n;r++){let[o,i]=e[r],[a,s]=e[(r+1)%n];t+=o*s-a*i}return t>0?-1:1}function zd(e,n=bi(e)){let t=e.length;return e.map((r,o)=>{let[i,a]=e[(o-1+t)%t],[s,l]=e[(o+1)%t],c=Math.hypot(s-i,l-a)||1;return[-(l-a)/c*n,(s-i)/c*n]})}function LA(e,{r:n=.01,every:t=Math.PI/12,sharp:r=Math.PI/6}={}){let o=e.length,i=bi(e),a=(f,u)=>{let d=Math.hypot(u[0]-f[0],u[1]-f[1])||1;return[(u[0]-f[0])/d,(u[1]-f[1])/d]},s=([f,u])=>[-u*i,f*i],l=[],c=[];for(let f=0;f<o;f++){let u=e[f],d=a(e[(f-1+o)%o],u),h=a(u,e[(f+1)%o]),_=s(d),T=s(h),m=Math.acos(Math.max(-1,Math.min(1,_[0]*T[0]+_[1]*T[1])));if(m<r||_[0]*h[0]+_[1]*h[1]>=0){l.push(u),c.push(f);continue}let p=Math.atan2(_[1],_[0]),S=Math.sign(_[0]*T[1]-_[1]*T[0]),M=Math.ceil(m/t);for(let g=0;g<=M;g++){let E=p+S*m*g/M;l.push([u[0]+Math.cos(E)*n,u[1]+Math.sin(E)*n]),c.push(f)}}return[l,c]}var ir={share:.6,fadeIn:.5,minFade:4,near:bs.full,end:150,fadeOut:.3,strength:1};function Wd(e,{longGrass:n=!0,shed:t=!1}={}){if(t||e==="standard"||!e)return null;let r=n?bs.radius[e]:void 0,o=r?r*ir.share:ir.near,i=o+Math.max(ir.minFade,o*ir.fadeIn),a=ir.end;return{start:o,full:i,fadeFrom:a*(1-ir.fadeOut),end:a,strength:ir.strength}}var Xd="far rough",vS="long grass";function $d(){let e=(ft==="high"||ft==="ultra")&&!Js(vS),n=Wd(ft,{longGrass:e,shed:Js(Xd)});zr.gFarRough.value=n?[n.start,n.full,n.fadeFrom,n.end]:[0,1,2,3],zr.gFarRoughK.value=n?n.strength:0}un(2.8,Xd,$d,{of:"medium"});$d();var ul=Pe&&Cn(Gt("effects",{}),ft).textures,hl=Pe&&Cn(Gt("effects",{}),ft).wetshine,dl=wt||hl,zn=null,Lt={rough:0,apron:.25,deep:.5,semi:.75,fairway:1,fairwayEdge:1.1,wear:1.5,fringe:2,tee:2,divot:2.1,verge:2.2,path:2.5,green:3,lip:4,sand:5,bank:4,water:6};function pl(e,n){let t=Lt.green-n;return t!==0&&Object.assign(e,{polygonOffset:!0,polygonOffsetFactor:t,polygonOffsetUnits:t*2}),e.userData.groundLayer=n,e}function SS(){if(zn)return zn;let e=256,n=document.createElement("canvas");n.width=n.height=e;let t=n.getContext("2d");t.fillStyle="rgb(200,200,200)",t.fillRect(0,0,e,e);for(let r=0;r<9e3;r++){let o=Math.random()*e,i=Math.random()*e,a=Math.random()*Math.PI,s=2+Math.random()*5,l=150+Math.random()*100;t.strokeStyle=`rgba(${l},${l},${l},0.55)`,t.lineWidth=1,t.beginPath(),t.moveTo(o,i),t.lineTo(o+Math.cos(a)*s,i+Math.sin(a)*s),t.stroke()}return zn=new uo(n),zn.wrapS=zn.wrapT=cn,zn.anisotropy=8,zn.colorSpace=fn,zn}function tR({light:e="#6aa640",dark:n="#5c9637",stripeWidth:t=8,stripeAngle:r=Math.PI/2,patch:o=.22,patchScale:i=.03,detailScale:a=1.2,detail:s=.8,tint:l=.5,hole:c=null,edge:f=!1,layer:u=Lt.green,worn:d=0,soil:h="#7d6a4b",clumps:_=0,settle:T=!1,wind:m=0,dune:p=0,mow:S=0,mowDir:M=null,centre:g=null,cleanup:E=!1,rim:b=!1,grain:R=null,shine:v=1}={}){let w=pl(new xn({color:16777215}),u);f&&Object.assign(w,{transparent:!0,depthWrite:!1});let y=!!c&&c.r>0;Vd(w,c);let P={gLight:{value:ll(e,"grass",al(u))},gDark:{value:ll(n,"grass",al(u))},gStripeWidth:{value:t},gStripeDir:{value:M?new je(...M).normalize():new je(Math.cos(r),Math.sin(r))},gMowKind:{value:S},gMowCentre:{value:new je(...g??[0,0])},gPatch:{value:o},gPatchScale:{value:i},gDetail:Pe?bo().tGrass:{value:SS()},gDetailScale:{value:a},gDetailStrength:{value:s},gTint:{value:l},gHole:{value:new ne(c?.x??0,c?.z??0,c?.r??0)},gWorn:{value:d},gSoil:{value:new ye(h)},gClumps:{value:_},gWindy:{value:m},gDune:{value:p},gGrain:{value:new ne(...R?[...new je(...R).normalize().toArray(),Qf.sheen]:[1,0,0])},gShine:{value:v}};return w.onBeforeCompile=D=>{Object.assign(D.uniforms,P,zr),D.vertexShader=D.vertexShader.replace("#include <common>",`#include <common>
varying vec3 gWorld;${f?`
attribute float gEdgeIn;
varying float gEdge;`:""}${b?`
attribute float gRimIn;
varying float gRim;`:""}`).replace("#include <project_vertex>",`#include <project_vertex>
gWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;${f?`
gEdge = gEdgeIn;`:""}${b?`
gRim = gRimIn;`:""}`),D.fragmentShader=D.fragmentShader.replace("#include <common>",`#include <common>
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
        ${b?"varying float gRim;":""}
        ${Pe?Nt?`#define GROUND_FINE
#define GROUND_PHONE`:`#define GROUND_FINE
#define GROUND_TEX`:""}
        ${ul?"#define GROUND_HERO":""}
        ${dl?"#define GROUND_PUDDLES":""}
        ${hl&&!T?"#define GROUND_SHINE":""}
        ${yd}
        ${Cd}
        float gPuddle = 0.0;
        float gDrops = 0.0;`).replace("#include <map_fragment>",`#include <map_fragment>
        {
          vec2 w = gWorld.xz;
          float stripe = 0.0;
          // Soft-edged bands, their edges wavering as a mower's do, in the
          // hole's pattern.
          if (gStripeWidth > 0.0) stripe = gMowing(w, gStripeDir, gStripeWidth, gMowKind, gMowCentre);
          ${E?"stripe = G_CLEANUP;":""}
          ${b?"stripe = mix(stripe, G_CLEANUP, 1.0 - smoothstep(0.55, 0.8, gRim));":""}
          // Far off - from high in a flyover - the long grass's and deep
          // rough's strongest patches eased (to the rough's), so round a
          // links hole its long grass isn't a dark, blotched band beside
          // the fairways (the owner: "a dark streaky band"). Close to, as
          // ever. (No more lookups: only how strong.)
          float gFarEase = smoothstep(${(T?Wn.from:Wn.fromAll).toFixed(1)}, ${(T?Wn.to:Wn.toAll).toFixed(1)}, distance(gWorld, cameraPosition));
          float gPatchK = mix(gPatch, min(gPatch, ${Wn.patch.toFixed(2)}), gFarEase);
          float gClumpK = mix(gClumps, min(gClumps, ${Wn.clumps.toFixed(2)}), gFarEase);
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
          ${p>0?`          if (gDune > 0.0) {
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
          ${Pe?"grass = gFarRoughLook(grass, w, gWorld, gWindy);":""}
          float d;
          float fade;
          grass = gBlades(grass, w, gDetail, gDetailScale, gDetailStrength, d, fade);
          // Under the long grass close to, its blades bolder (NEAR_FLOOR).
          if (gClumps > 0.5) grass *= 1.0 + ${go.boost.toFixed(2)} * fade * (d - ${go.mean.toFixed(3)}) * (1.0 - smoothstep(${go.from.toFixed(1)}, ${go.to.toFixed(1)}, distance(gWorld, cameraPosition)));
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
          ${T?`grass = mix(grass, mix(gLight, gDark, 0.5) * ${Wn.flat.toFixed(2)}, gFarEase * ${Wn.settle.toFixed(2)});`:""}
          // A shade darker after rain.
          grass = gWetGround(grass);
          ${dl?`// On Ultra (or with wet reflections), after rain: puddles lying in the turf - in patches,
          // more and bigger the wetter it is, ragged at their edges; never
          // on the green with the cup.
          if (gWet > 0.05 && gHole.z <= 0.0) {
            float pn = 0.7 * gNoise(w * 0.09 + 31.0) + 0.3 * gNoise(w * 0.6 + 5.0);
            gPuddle = smoothstep(0.86 - 0.2 * gWet, 0.9 - 0.2 * gWet, pn) * smoothstep(0.05, 0.4, gWet);
            // The grass at a puddle's edge darker, soaked.
            grass *= 1.0 - 0.3 * smoothstep(0.78 - 0.2 * gWet, 0.88 - 0.2 * gWet, pn) * gWet;
          }`:""}
          ${Pe?`// While it rains (the Rain on the ground switch): drops splashing
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
          ${y?`// The cup's hole - only in the patch round the cup (look/cupcut.js:
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
${Pe?Pd("gLean"):""}`).replace("#include <opaque_fragment>",`#if defined(GROUND_PUDDLES) && defined(USE_FOG)
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
        #include <opaque_fragment>`)},w.customProgramCacheKey=()=>`grass-v12${p>0?"d":""}-${wd}-${wt?"u":Pe?"h":"s"}${ul?"-hero":""}${Nt?"-p":""}${f?"-edge":""}${E?"-clean":""}${b?"-rim":""}${hl?"-shine":""}${T?"-st":""}${y?"-cup":""}-r1`,nn(w,"grass",{light:P.gLight.value,dark:P.gDark.value,stripeWidth:t,stripeAngle:r,mow:S,mowDir:M,centre:g,cleanup:E,rim:b,patch:o,patchScale:i,detailScale:a,detail:s,detailMap:P.gDetail,tint:l,hole:c,edge:f,layer:u,worn:d,soil:h,clumps:_,settle:T,wind:m,dune:p,grain:R,fine:Pe,hero:ul,tex:Pe,puddleDark:dl}),Vn(w,"ground")}function nR(e,n,t=()=>0,r=0){return xS(e,[{off:0,edge:1},{off:n,edge:0}],t,r)}function xS(e,n,t=()=>0,r=0){let o=e.length,i=bi(e),a=zd(e,i),s=typeof n=="function"?n:()=>n,l=e.map((_,T)=>s(T)),c=l[0].length,f=[],u=[],d=[];for(let _=0;_<o;_++){let[T,m]=e[_],[p,S]=a[_];for(let M of l[_]){let g=T+p*M.off,E=m+S*M.off;f.push(g,t(g,E)+r,E),u.push(M.edge)}for(let M=0;M+1<c;M++){let g=_*c+M,E=(_+1)%o*c+M,b=l[_][M+1].off>l[_][M].off;i>0===b?d.push(g,g+1,E,E,g+1,E+1):d.push(g,E,g+1,E,E+1,g+1)}}let h=new xt;return h.setAttribute("position",new Yt(f,3)),h.setAttribute("gEdgeIn",new Yt(u,1)),h.setIndex(d),h.computeVertexNormals(),h}function rR(e,n,t,r){let o=e.geometry.attributes.position,i=new Float32Array(o.count);for(let a=0;a<o.count;a++){let s=o.getX(a)-n,l=o.getZ(a)-t;i[a]=r(Math.atan2(l,s))-Math.hypot(s,l)}return e.geometry.setAttribute("gRimIn",new Ge(i,1)),e}function oR(e){return{mow:e.kind,mowDir:Rd(e.dir)}}function iR(e,n,t,r,o=1){let i=[],a=(s,l,c,f)=>{let u=Math.max(1,Math.ceil(Math.hypot(c-s,f-l)/o));for(let d=0;d<u;d++)i.push([s+(c-s)*d/u,l+(f-l)*d/u])};return a(e,n,t,n),a(t,n,t,r),a(t,r,e,r),a(e,r,e,n),i}var mt=pt,Yd=1,wi=1.25,Wn={fromAll:90,toAll:240,from:25,to:110,patch:.2,clumps:.6,flat:.92,settle:.75},aR={rough:{light:mt.rough[0],dark:mt.rough[1],stripeWidth:0,patch:.35,patchScale:.02,detailScale:.9,tint:.7,clumps:Yd,wind:1,shine:.25,layer:Lt.rough},deep:{light:mt.deep,dark:mt.deep,stripeWidth:0,patch:.45,patchScale:.05,detailScale:.7,detail:1,tint:.8,clumps:wi,wind:1,settle:!0,layer:Lt.deep},duneRough:{light:mt.duneRough,dark:mt.duneRough,stripeWidth:0,patch:.2,patchScale:.03,detailScale:.9,detail:1,tint:.6,clumps:Yd*.8,wind:2,dune:1,shine:.25,layer:Lt.rough},fescue:{light:mt.fescue,dark:mt.fescueDry,stripeWidth:0,patch:.22,patchScale:.035,detailScale:.6,detail:1,tint:.6,clumps:wi*.7,wind:2.6,dune:1,settle:!0,layer:Lt.deep},hay:{light:mt.hay,dark:mt.hayDry,stripeWidth:0,patch:.25,patchScale:.03,detailScale:.6,detail:1,tint:.55,clumps:wi*.6,wind:3.2,dune:1,settle:!0,layer:Lt.deep},longGreen:{light:mt.longGreen,dark:mt.longGreen,stripeWidth:0,patch:.65,patchScale:.035,detailScale:.7,detail:1,tint:.9,clumps:wi*1.3,wind:2.3,dune:.7,settle:!0,layer:Lt.deep},fairway:{light:mt.fairway[0],dark:mt.fairway[1],stripeWidth:9,stripeAngle:Math.PI/2,patch:.18,layer:Lt.fairway},semi:{light:mt.firstCut[0],dark:mt.firstCut[1],stripeWidth:0,patch:.26,patchScale:.03,detailScale:.8,tint:.6,clumps:.35,wind:.5,shine:.6,layer:Lt.semi},green:{light:mt.green[0],dark:mt.green[1],stripeWidth:3,stripeAngle:0,patch:.1,patchScale:.08,detailScale:.5,detail:.5,tint:.2,layer:Lt.green},fringe:{light:mt.fringe,dark:mt.fringe,stripeWidth:0,patch:.12,detailScale:.7,layer:Lt.fringe},tee:{light:mt.tee[0],dark:mt.tee[1],stripeWidth:1.5,stripeAngle:0,patch:.1,layer:Lt.tee}};function sR(e,n,t=Lt.fairway){let r=new Rt(e,n);return r.renderOrder=-10+t,r.receiveShadow=!0,r}function Ve(e,n=!1){let t=e[0].index!==null,r=new Set(Object.keys(e[0].attributes)),o=new Set(Object.keys(e[0].morphAttributes)),i={},a={},s=e[0].morphTargetsRelative,l=new xt,c=0;for(let f=0;f<e.length;++f){let u=e[f],d=0;if(t!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+f+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let h in u.attributes){if(!r.has(h))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+f+'. All geometries must have compatible attributes; make sure "'+h+'" attribute exists among all geometries, or in none of them.'),null;i[h]===void 0&&(i[h]=[]),i[h].push(u.attributes[h]),d++}if(d!==r.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+f+". Make sure all geometries have the same number of attributes."),null;if(s!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+f+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let h in u.morphAttributes){if(!o.has(h))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+f+".  .morphAttributes must be consistent throughout all geometries."),null;a[h]===void 0&&(a[h]=[]),a[h].push(u.morphAttributes[h])}if(n){let h;if(t)h=u.index.count;else if(u.attributes.position!==void 0)h=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+f+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,h,f),c+=h}}if(t){let f=0,u=[];for(let d=0;d<e.length;++d){let h=e[d].index;for(let _=0;_<h.count;++_)u.push(h.getX(_)+f);f+=e[d].attributes.position.count}l.setIndex(u)}for(let f in i){let u=Kd(i[f]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+f+" attribute."),null;l.setAttribute(f,u)}for(let f in a){let u=a[f][0].length;if(u!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[f]=[];for(let d=0;d<u;++d){let h=[];for(let T=0;T<a[f].length;++T)h.push(a[f][T][d]);let _=Kd(h);if(!_)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+f+" morphAttribute."),null;l.morphAttributes[f].push(_)}}}return l}function Kd(e){let n,t,r,o=-1,i=0;for(let c=0;c<e.length;++c){let f=e[c];if(n===void 0&&(n=f.array.constructor),n!==f.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=f.itemSize),t!==f.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(r===void 0&&(r=f.normalized),r!==f.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(o===-1&&(o=f.gpuType),o!==f.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;i+=f.count*t}let a=new n(i),s=new Ge(a,t,r),l=0;for(let c=0;c<e.length;++c){let f=e[c];if(f.isInterleavedBufferAttribute){let u=l/t;for(let d=0,h=f.count;d<h;d++)for(let _=0;_<t;_++){let T=f.getComponent(d,_);s.setComponent(d+u,_,T)}}else a.set(f.array,l);l+=f.count*t}return o!==void 0&&(s.gpuType=o),s}function ml(e,n=1e-4){n=Math.max(n,Number.EPSILON);let t={},r=e.getIndex(),o=e.getAttribute("position"),i=r?r.count:o.count,a=0,s=Object.keys(e.attributes),l={},c={},f=[],u=["getX","getY","getZ","getW"],d=["setX","setY","setZ","setW"];for(let S=0,M=s.length;S<M;S++){let g=s[S],E=e.attributes[g];l[g]=new E.constructor(new E.array.constructor(E.count*E.itemSize),E.itemSize,E.normalized);let b=e.morphAttributes[g];b&&(c[g]||(c[g]=[]),b.forEach((R,v)=>{let w=new R.array.constructor(R.count*R.itemSize);c[g][v]=new R.constructor(w,R.itemSize,R.normalized)}))}let h=n*.5,_=Math.log10(1/n),T=Math.pow(10,_),m=h*T;for(let S=0;S<i;S++){let M=r?r.getX(S):S,g="";for(let E=0,b=s.length;E<b;E++){let R=s[E],v=e.getAttribute(R),w=v.itemSize;for(let y=0;y<w;y++)g+=`${Math.trunc(v[u[y]](M)*T+m)},`}if(g in t)f.push(t[g]);else{for(let E=0,b=s.length;E<b;E++){let R=s[E],v=e.getAttribute(R),w=e.morphAttributes[R],y=v.itemSize,P=l[R],D=c[R];for(let I=0;I<y;I++){let L=u[I],H=d[I];if(P[H](a,v[L](M)),w)for(let z=0,F=w.length;z<F;z++)D[z][H](a,w[z][L](M))}}t[g]=a,f.push(a),a++}}let p=e.clone();for(let S in e.attributes){let M=l[S];if(p.setAttribute(S,new M.constructor(M.array.slice(0,a*M.itemSize),M.itemSize,M.normalized)),S in c)for(let g=0;g<c[S].length;g++){let E=c[S][g];p.morphAttributes[S][g]=new E.constructor(E.array.slice(0,a*E.itemSize),E.itemSize,E.normalized)}}return p.setIndex(f),p}function fR(e,n=Math.PI/3){let t=e.index?e.toNonIndexed():e,r=t.attributes.position,o=r.count,i;if(r.isBufferAttribute===!0&&r.itemSize===3&&r.normalized===!1)i=r.array;else{i=new Float64Array(o*3);for(let g=0;g<o;g++)i[3*g+0]=r.getX(g),i[3*g+1]=r.getY(g),i[3*g+2]=r.getZ(g)}let a=Math.cos(n),s=(1+1e-10)*100,l=o/3,c=new Float64Array(l*3);for(let g=0;g<l;g++){let E=9*g,b=i[E+0],R=i[E+1],v=i[E+2],w=i[E+3],y=i[E+4],P=i[E+5],D=i[E+6],I=i[E+7],L=i[E+8],H=D-w,z=I-y,F=L-P,X=b-w,$=R-y,j=v-P,Z=z*j-F*$,ge=F*X-H*j,Ee=H*$-z*X,ze=1/(Math.sqrt(Z*Z+ge*ge+Ee*Ee)||1);c[3*g+0]=Z*ze,c[3*g+1]=ge*ze,c[3*g+2]=Ee*ze}let f=new Int32Array(o),u=new Float64Array(o*3),d=1;for(;d<o*2;)d<<=1;let h=d-1,_=new Int32Array(d),T=0;for(let g=0;g<o;g++){let E=3*g,b=Math.trunc(i[E+0]*s),R=Math.trunc(i[E+1]*s),v=Math.trunc(i[E+2]*s),w=(Math.imul(b,73856093)^Math.imul(R,19349663)^Math.imul(v,83492791))&h;for(;;){let y=_[w];if(y===0){let D=3*T;u[D+0]=b,u[D+1]=R,u[D+2]=v,_[w]=T+1,f[g]=T++;break}let P=3*(y-1);if(u[P+0]===b&&u[P+1]===R&&u[P+2]===v){f[g]=y-1;break}w=w+1&h}}let m=new Int32Array(T+1);for(let g=0;g<o;g++)m[f[g]+1]++;for(let g=0;g<T;g++)m[g+1]+=m[g];let p=new Int32Array(o),S=m.slice(0,T);for(let g=0;g<l;g++){let E=3*g;p[S[f[E+0]]++]=g,p[S[f[E+1]]++]=g,p[S[f[E+2]]++]=g}let M=new Float32Array(o*3);for(let g=0;g<l;g++){let E=3*g,b=c[E+0],R=c[E+1],v=c[E+2];for(let w=0;w<3;w++){let y=E+w,P=f[y],D=0,I=0,L=0;for(let z=m[P],F=m[P+1];z<F;z++){let X=3*p[z],$=c[X+0],j=c[X+1],Z=c[X+2];b*$+R*j+v*Z>a&&(D+=$,I+=j,L+=Z)}let H=1/(Math.sqrt(D*D+I*I+L*L)||1);M[3*y+0]=D*H,M[3*y+1]=I*H,M[3*y+2]=L*H}}return t.setAttribute("normal",new Ge(M,3,!1)),t}var ES={size:70,fine:26,hue:.03,sat:.08,light:.055};function qd(e,n,t=0){let r=ES,o=$o(e,n,r.size,t^334461)*2-1,i=$o(e+113.7,n-41.3,r.fine,t^11239)*2-1,a=.7*o+.3*i,s=$o(e-57.1,n+89.9,r.size*1.3,t^30657)*2-1;return{hue:-r.hue*a,sat:r.sat*s,light:r.light*a}}var wo={radius:9,crowded:6,hue:.012,sat:.04,light:.045};function Zd(e,{radius:n=wo.radius,crowded:t=wo.crowded}={}){let r=n,o=new Map,i=(l,c)=>l*73856093+c*19349663;e.forEach(([l,c],f)=>{let u=i(Math.floor(l/r),Math.floor(c/r)),d=o.get(u);d?d.push(f):o.set(u,[f])});let a=new Float32Array(e.length),s=n*n;return e.forEach(([l,c],f)=>{let u=Math.floor(l/r),d=Math.floor(c/r),h=0;for(let _=u-1;_<=u+1;_++)for(let T=d-1;T<=d+1;T++)for(let m of o.get(i(_,T))??[]){if(m===f)continue;let p=e[m][0]-l,S=e[m][1]-c;p*p+S*S<=s&&h++}a[f]=Math.max(0,1-h/t)}),a}function jd(e,n){let t=n*2-1;return{hue:e.hue-wo.hue*t,sat:e.sat+wo.sat*t,light:e.light+wo.light*t}}var ar={r:{oak:2.1,leaf:1.8,willow:1.9,poplar:1.3,birch:1.2,bush:1,pine:1.7,scots:1.7,spruce:1.6,column:1.1,snag:.9,beech:2.2,chestnut:2,cedar:2.3,holly:1.1,hawthorn:1.2},least:.6,most:3,needles:new Set(["pine","scots","spruce","column","cedar"]),lift:.02},Qd={leaves:[1,1,1],needles:[1.12,.92,.78],soil:[.92,.9,.88]};function Jd(e,n=1,t=0){let r=ar.r[e]??ar.r.leaf,o=Math.min(ar.most,Math.max(ar.least,r*n)),i=e==="snag"?"soil":ar.needles.has(e)?"needles":"leaves",a=Math.sin((t+1)*12.9898)*43758.5453;return{r:o,litter:i,turn:(a-Math.floor(a))*Math.PI*2}}function MS(e){return()=>(e=Math.imul(e,1664525)+1013904223|0,(e>>>0)/4294967296)}var Xr=null;function TS(){if(Xr)return Xr;let e=512,n=document.createElement("canvas");n.width=n.height=e;let t=n.getContext("2d"),r=MS(61447),o=e/2;for(let i=0;i<160;i++){let a=r()*Math.PI*2,s=Math.pow(r(),.7)*o*.78,l=o*(.08+r()*.16)*(1-s/o*.5),c=t.createRadialGradient(o+Math.cos(a)*s,o+Math.sin(a)*s,0,o+Math.cos(a)*s,o+Math.sin(a)*s,l),f=40+r()*22,u=.34+r()*.2;c&&(c.addColorStop(0,`rgba(${f+22},${f+10},${f-6},${u})`),c.addColorStop(1,`rgba(${f+22},${f+10},${f-6},0)`),t.fillStyle=c,t.fillRect(0,0,e,e))}for(let i=0;i<900;i++){let a=r()*Math.PI*2,s=Math.pow(r(),.85)*o*.86,l=1-Math.pow(s/(o*.86),2);if(r()>l+.15)continue;let c=r(),[f,u,d]=c<.45?[118,82,44]:c<.75?[150,112,60]:c<.9?[92,64,38]:[98,110,52],h=.8+r()*.4;t.save(),t.translate(o+Math.cos(a)*s,o+Math.sin(a)*s),t.rotate(r()*Math.PI),t.fillStyle=`rgba(${f*h},${u*h},${d*h},${.6+r()*.35})`,t.beginPath(),t.ellipse(0,0,3+r()*4,1.6+r()*2,0,0,Math.PI*2),t.fill(),t.restore()}t.lineCap="round";for(let i=0;i<70;i++){let a=r()*Math.PI*2,s=r()*o*.7,l=o+Math.cos(a)*s,c=o+Math.sin(a)*s,f=r()*Math.PI,u=6+r()*16;t.strokeStyle=`rgba(${60+r()*30},${44+r()*20},28,${.55+r()*.3})`,t.lineWidth=1+r()*1.4,t.beginPath(),t.moveTo(l,c),t.lineTo(l+Math.cos(f)*u,c+Math.sin(f)*u),t.stroke()}for(let i=0;i<6;i++){let a=i/6*Math.PI*2+r()*.6;t.strokeStyle="rgba(58,40,24,0.55)",t.lineWidth=7-i*.4,t.beginPath(),t.moveTo(o,o);let s=o*(.22+r()*.18),l=(r()-.5)*.5;t.quadraticCurveTo(o+Math.cos(a+l)*s*.6,o+Math.sin(a+l)*s*.6,o+Math.cos(a)*s,o+Math.sin(a)*s),t.stroke()}return Xr=new uo(n),Xr.colorSpace=Lr,Xr.anisotropy=4,Xr}var bS={pc:{seg:20,rings:[0,.35,.7,1]},phone:{seg:12,rings:[0,.5,1]}};function eh(e,n,{phone:t=Nt}={}){if(!e.length)return null;let{seg:r,rings:o}=bS[t?"phone":"pc"],i=1+r*(o.length-1),a=new Float32Array(e.length*i*3),s=new Float32Array(e.length*i*2),l=new Float32Array(e.length*i*3),c=[];e.forEach((_,T)=>{let m=Jd(_.kind,_.width,_.seed),p=Qd[m.litter],S=T*i,M=(g,E,b,R,v)=>{a.set([E,n(E,b)+ar.lift,b],(S+g)*3),s.set([R,v],(S+g)*2),l.set(p,(S+g)*3)};M(0,_.x,_.z,.5,.5);for(let g=1;g<o.length;g++)for(let E=0;E<r;E++){let b=E/r*Math.PI*2,R=o[g]*m.r;M(1+(g-1)*r+E,_.x+Math.cos(b)*R,_.z+Math.sin(b)*R,.5+Math.cos(b+m.turn)*o[g]*.5,.5+Math.sin(b+m.turn)*o[g]*.5)}for(let g=0;g<r;g++)c.push(S,S+1+(g+1)%r,S+1+g);for(let g=1;g<o.length-1;g++){let E=S+1+(g-1)*r,b=E+r;for(let R=0;R<r;R++){let v=(R+1)%r;c.push(E+R,E+v,b+R,b+R,E+v,b+v)}}});let f=new xt;f.setAttribute("position",new Ge(a,3)),f.setAttribute("uv",new Ge(s,2)),f.setAttribute("color",new Ge(l,3)),f.setIndex(c),f.computeVertexNormals();let u=f.attributes.normal;for(let _=0;_<u.count;_++)u.getY(_)<0&&u.setXYZ(_,-u.getX(_),-u.getY(_),-u.getZ(_));let d=Vn(pl(new xn({map:TS(),vertexColors:!0,transparent:!0,depthWrite:!1}),Lt.wear),"ground"),h=new Rt(f,d);return h.name="tree feet",h.renderOrder=-10+Lt.wear,h.receiveShadow=!0,h}var lr=null,rh=typeof fetch=="function"&&typeof location<"u"&&/^https?:$/.test(location.protocol)?fetch("/api/bakes").then(e=>e.ok?e.json():null).then(e=>{lr=typeof e?.stamp=="string"?e.stamp:null}).catch(()=>{}):Promise.resolve();function ER(){return!!lr}function Ri(e,n=!1){let t=r=>n?r.slice():r;return{attributes:Object.entries(e.attributes).map(([r,o])=>[r,t(o.array),o.itemSize,!!o.normalized]),index:e.index?t(e.index.array):null,groups:e.groups.map(r=>({...r})),drawRange:[e.drawRange.start,e.drawRange.count],sphere:!!e.boundingSphere,box:!!e.boundingBox}}function _l(e){let n=new xt;for(let[t,r,o,i]of e.attributes)n.setAttribute(t,new Ge(r,o,i));e.index&&n.setIndex(new Ge(e.index,1));for(let t of e.groups??[])n.addGroup(t.start,t.count,t.materialIndex);return e.drawRange&&n.setDrawRange(e.drawRange[0],e.drawRange[1]),e.box&&n.computeBoundingBox(),e.sphere&&n.computeBoundingSphere(),n}var wS=e=>e?.isBufferGeometry?Ri(e):e,AS=e=>oo(e??null,{as:wS});function Ai(e){if(e===null||typeof e!="object")return e;if(ArrayBuffer.isView(e))return e.slice();if(Array.isArray(e))return e.map(Ai);let n={};for(let[t,r]of Object.entries(e))n[t]=Ai(r);return n}var Ao=class{constructor(n,t=new Map){this.key=n,this.kept=t,this.used=new Map,this.made=new Map,this.hits=0,this.misses=0,this.first=!1,this.ms=0}partKey(n,t){return`${n}:${AS(t)}`}take(n){let t=this.used.get(n)??this.made.get(n)??this.kept.get(n);if(t!==void 0)return this.made.has(n)||this.used.set(n,t),Ai(t)}has(n,t){let r=this.partKey(n,t);return this.made.has(r)||this.used.has(r)||this.kept.has(r)}geometry(n,t,r,{keep:o=null}={}){let i=performance.now(),a=this.partKey(n,t),s=this.take(a);if(this.ms+=performance.now()-i,s)return this.hits++,_l(s);let l=r();if(this.misses++,o&&!o())return l;let c=performance.now();return this.made.set(a,Ri(l,!0)),this.ms+=performance.now()-c,l}find(n,t){let r=performance.now(),o=this.take(this.partKey(n,t));return this.ms+=performance.now()-r,o!==void 0&&this.hits++,o}keep(n,t,r){this.keepAt(this.partKey(n,t),r)}keepAt(n,t){if(t==null)return;let r=performance.now();this.made.set(n,Ai(t)),this.ms+=performance.now()-r,this.misses++}get changed(){return this.made.size>0}entries(){return new Map([...this.used,...this.made])}bytes(){return Ac(this.entries())}summary(){return{hits:this.hits,misses:this.misses,ms:Math.round(this.ms)}}};async function oh(e,n){await rh;let t=lr&&n?sa(lr,e,n):null;if(!t)return null;try{let r=await fetch(`/api/bakes/${t}`);return r.ok?new Ao(t,Rc(await r.arrayBuffer())):new Ao(t)}catch(r){return console.warn("Couldn't read the kept hole; building it afresh:",r?.message??r),new Ao(t)}}function MR(e,n){return lr&&n?sa(lr,e,n):null}async function TR(){if(await rh,!lr)return null;try{let e=await fetch("/api/bakes?names=1");if(!e.ok)return null;let n=await e.json();return Array.isArray(n?.names)?new Set(n.names):null}catch{return null}}var th=!1,sr=null,gl=typeof Worker>"u",RS=1,$r=new Map;function yS(){if(gl)return null;if(sr)return sr;try{sr=new Worker(new URL("../bakeworker.js",import.meta.url),{type:"module"})}catch{return gl=!0,null}return sr.onmessage=({data:e})=>{let n=$r.get(e.id);$r.delete(e.id),n?.(e)},sr.onerror=()=>{gl=!0,sr=null;for(let e of $r.values())e({error:"the worker stopped"});$r.clear()},sr}function ih(e,n=new Set){if(!e||typeof e!="object")return n;if(ArrayBuffer.isView(e))return e.buffer instanceof ArrayBuffer&&n.add(e.buffer),n;for(let t of e instanceof Map?e.values():Object.values(e))ih(t,n);return n}var CS=(e,n=!1)=>`/api/bakes/${e}${n?"?first=1":""}`;async function ah(e){if(!e?.changed)return 0;let n=r=>(th||console.warn("Couldn't keep the hole for next time:",r?.message??r),th=!0,0),t=yS();if(t){let r=e.entries(),o=RS++,i=new Promise(s=>$r.set(o,s));try{t.postMessage({id:o,key:e.key,first:e.first,entries:r,back:PS},[...ih(r)])}catch(s){return $r.delete(o),n(s)}let a=await i;return a.error?n(new Error(a.error)):a.data?nh(e,a.data,n):a.bytes}return nh(e,e.bytes(),n)}var PS=typeof window<"u"&&!!window.pocket;async function nh(e,n,t){try{let r=await fetch(CS(e.key,e.first),{method:"PUT",headers:{"Content-Type":"application/octet-stream"},body:new Blob([n])});if(!r.ok)throw new Error(`the server said ${r.status}`);return n.byteLength}catch(r){return t(r)}}function bR(e,n={}){if(!e)return null;try{return oo({site:e,...n})}catch{return null}}function sh(e,n,t,r,o){let i=Math.max(0,Math.floor(o));if(!i||t<=2*i||r<=2*i)return n;let a=e===n?e.slice():e,s=new Int32Array(t*r);for(let l=0;l<r;l++){let c=l*t,f=0;for(let u=0;u<2*i;u++)a[(c+u)*4+3]>=200&&f++;for(let u=i;u<t-i;u++)a[(c+u+i)*4+3]>=200&&f++,s[c+u]=f,a[(c+u-i)*4+3]>=200&&f--}for(let l=i;l<r-i;l++)for(let c=i;c<t-i;c++){let f=(l*t+c)*4;if(a[f+3]>16)continue;let u=0;for(let T=-i;T<=i;T++)u+=s[(l+T)*t+c];if(!u)continue;let d=0,h=0,_=0;for(let T=-i;T<=i;T++)for(let m=-i;m<=i;m++){let p=((l+T)*t+(c+m))*4;a[p+3]<200||(d+=a[p],h+=a[p+1],_+=a[p+2])}n[f]=d/u,n[f+1]=h/u,n[f+2]=_/u,n[f+3]=32}return n}var Ro={near:3.5,close:6,apart:.36,out:1.06,radius:[.42,.58],droop:.3,wave:.3,up:.4,under:-.6,over:1,fresh:.3,freshTint:[1,1,.74]},vl=6;function lh(e,n,t,r=Ro){let o=[];for(let[p,S,M,g]of e){let E=Math.max(12,Math.round(g*g*10));for(let b=0;b<E;b++){let R=r.under+((r.over??1)-r.under)*((b+n())/E),v=b*2.39996+n()*.8,w=Math.sqrt(Math.max(0,1-R*R)),y=[w*Math.cos(v),R,w*Math.sin(v)],P=[p+y[0]*g*r.out,S+y[1]*g*r.out,M+y[2]*g*r.out];e.some(([D,I,L,H])=>(D!==p||I!==S||L!==M)&&Math.hypot(P[0]-D,P[1]-I,P[2]-L)<H*1.02)||o.push({at:P,dir:y,r:g,pick:n()})}}o.sort((p,S)=>p.pick-S.pick);let i=[];for(let p of o){if(i.length>=t)break;i.every(S=>Math.hypot(S.at[0]-p.at[0],S.at[1]-p.at[1],S.at[2]-p.at[2])>=r.apart*Math.min(S.r,p.r))&&i.push(p)}if(!i.length)return null;let a=[],s=[],l=[],c=[],f=[],u=new ne,d=new ne,h=new ne,_=new ne,T=new ne;for(let{at:p,dir:S,r:M}of i){let g=M*(r.radius[0]+n()*(r.radius[1]-r.radius[0])),E=n()*Math.PI*2,b=.86+n()*.14;u.set(S[0],S[1]+r.up,S[2]).normalize(),d.set(0,1,0),Math.abs(u.y)>.92&&d.set(1,0,0),d.cross(u).normalize(),h.crossVectors(u,d);let R=a.length/3;a.push(p[0],p[1],p[2]),s.push(u.x,u.y,u.z),l.push(.5,.5);let v=((R+1)*2654435761>>>0)/4294967296<(r.fresh??0),[w,y,P]=v?r.freshTint:[b,b,b];c.push(w,y,P);for(let D=0;D<vl;D++){let I=E+D/vl*Math.PI*2,[L,H]=[Math.cos(I),Math.sin(I)],z=r.droop*g*(1+(D%2?r.wave:-r.wave));_.set(p[0],p[1],p[2]).addScaledVector(d,L*g).addScaledVector(h,H*g).addScaledVector(u,-z),T.copy(u).addScaledVector(d,L*.6).addScaledVector(h,H*.6).normalize(),a.push(_.x,_.y,_.z),s.push(T.x,T.y,T.z),l.push(.5+.5*L,.5+.5*H),c.push(w*.9,y*.9,P*.9),f.push(R,R+1+D,R+1+(D+1)%vl)}}let m=new xt;return m.setAttribute("position",new Ge(new Float32Array(a),3)),m.setAttribute("normal",new Ge(new Float32Array(s),3)),m.setAttribute("uv",new Ge(new Float32Array(l),2)),m.setAttribute("color",new Ge(new Float32Array(c),3)),m.setIndex(f),m}var Sl=(e,n=1)=>`rgb(${e*.42*n|0},${e*.7*n|0},${e*.3*n|0})`,ch=e=>`rgb(${e*.6|0},${Math.min(255,e*.95)|0},${e*.42|0})`,yi=(e,n=0)=>`rgb(${e*(.38-n*.08)|0},${e*.7|0},${e*(.3+n*.22)|0})`,LS={leaves:26,len:[34,50],wide:.44,spines:4,spine:.3,berries:4,berry:4.4},DS={leaves:46,len:[17,27],lobes:3},US={sprays:7,leaves:7,len:[24,34],wide:.3},IS={twigs:9,needles:30,len:[7,11]},NS={tufts:11,needles:22,len:[26,40]},OS={sprays:6,rosettes:9,needles:9,len:[7,10],cones:3};function yo(e,n,t,r,o,i){let a=[];for(let s=0;s<e;s++){let l=t()*Math.PI*2,c=n*r*Math.sqrt(t());a.push([n/2+Math.cos(l)*c,n/2+Math.sin(l)*c,t()*Math.PI*2,o+t()*(i-o)])}return a.sort((s,l)=>s[3]-l[3])}function FS(e,n,t,{dilate:r}){let o=LS,i=(s,l,c,f,u)=>{let d=f*o.wide;e.save(),e.translate(s,l),e.rotate(c);let h=T=>{let m=[];for(let p=0;p<=o.spines;p++){let S=(p+.5)/(o.spines+.5),M=Math.sin(Math.min(1,S*.98)*Math.PI)*.9+.1;m.push([f*(S-.5/(o.spines+.5))*.94,T*d*M*(1-o.spine)]),m.push([f*S*.94,T*d*M*(1+o.spine)])}return m},_=()=>{e.beginPath(),e.moveTo(0,0);for(let[T,m]of h(1))e.lineTo(T,m);e.lineTo(f,0);for(let[T,m]of h(-1).reverse())e.lineTo(T,m);e.closePath()};e.save(),e.globalCompositeOperation="source-atop",e.translate(f*.05,f*.06),_(),e.fillStyle="rgba(10,22,10,0.3)",e.fill(),e.restore(),_(),e.fillStyle=Sl(u,.9),e.fill(),e.save(),e.globalCompositeOperation="source-atop",e.fillStyle=`rgba(${Math.min(255,u*1.25)|0},${Math.min(255,u*1.5)|0},${Math.min(255,u*1.05)|0},0.4)`,e.beginPath(),e.ellipse(f*.5,-d*.3,f*.3,d*.16,0,0,Math.PI*2),e.fill(),e.strokeStyle=`rgba(${u*.9|0},${Math.min(255,u*1.15)|0},${u*.5|0},0.9)`,e.lineWidth=Math.max(.6,f*.028),e.beginPath(),e.moveTo(f*.04,0),e.lineTo(f*.95,0),e.stroke(),e.restore(),e.restore()},a=yo(o.leaves,n,t,.36,92,168);for(let[s,l,c,f]of a)i(s,l,c,o.len[0]+t()*(o.len[1]-o.len[0]),f);for(let s=0;s<o.berries;s++){let l=t()*Math.PI*2,c=n*.3*Math.sqrt(t()),f=n/2+Math.cos(l)*c,u=n/2+Math.sin(l)*c,d=3+Math.floor(t()*3);for(let h=0;h<d;h++){let _=f+(t()-.5)*o.berry*2.4,T=u+(t()-.5)*o.berry*2.4,m=o.berry*(.8+t()*.35);e.fillStyle="rgb(150,14,18)",e.beginPath(),e.arc(_+m*.12,T+m*.14,m,0,Math.PI*2),e.fill(),e.fillStyle="rgb(255,52,40)",e.beginPath(),e.arc(_,T,m*.88,0,Math.PI*2),e.fill(),e.fillStyle="rgba(255,225,215,0.85)",e.beginPath(),e.arc(_-m*.3,T-m*.32,m*.26,0,Math.PI*2),e.fill()}}r(e,2)}function HS(e,n,t,{dilate:r}){let o=DS,i=(a,s,l,c,f)=>{e.save(),e.translate(a,s),e.rotate(l);let u=o.lobes+Math.floor(t()*2),d=()=>{e.beginPath(),e.moveTo(0,0);let h=44;for(let _=0;_<=h;_++){let T=-1+2*_/h,m=T*1.95,p=Math.pow(Math.abs(Math.cos(T*u*Math.PI*.5)),.55),S=c*(.34+.66*p)*(.62+.38*Math.cos(m*.5));e.lineTo(c*.18+Math.cos(m)*S*.82,Math.sin(m)*S*.82)}e.closePath()};e.save(),e.globalCompositeOperation="source-atop",e.translate(c*.06,c*.07),d(),e.fillStyle="rgba(18,30,12,0.24)",e.fill(),e.restore(),d(),e.fillStyle=Sl(f),e.fill(),e.save(),e.translate(c*.3,0),e.scale(.55,.5),e.translate(-c*.18,0),d(),e.fillStyle=ch(f),e.fill(),e.restore(),e.strokeStyle=`rgba(${f*.75|0},${Math.min(255,f)|0},${f*.35|0},0.8)`,e.lineWidth=Math.max(.5,c*.035),e.beginPath(),e.moveTo(-c*.12,0),e.lineTo(c*.78,0),e.stroke(),e.restore()};for(let[a,s,l,c]of yo(o.leaves,n,t,.39,100,178))i(a,s,l,o.len[0]+t()*(o.len[1]-o.len[0]),c);r(e,1)}function BS(e,n,t,{dilate:r}){let o=US,i=(s,l,c,f,u)=>{let d=f*o.wide;e.save(),e.translate(s,l),e.rotate(c);let h=()=>{e.beginPath(),e.moveTo(0,0);let _=16;for(let T=1;T<=_;T++)e.lineTo(T/_*f,d*Math.pow(Math.sin(T/_*Math.PI),.8)*(1-.25*(T/_)));for(let T=_;T>=0;T--)e.lineTo(T/_*f,-d*Math.pow(Math.sin(T/_*Math.PI),.8)*(1-.25*(T/_)));e.closePath()};e.save(),e.globalCompositeOperation="source-atop",e.translate(f*.05,f*.06),h(),e.fillStyle="rgba(18,30,12,0.22)",e.fill(),e.restore(),h(),e.fillStyle=Sl(u),e.fill(),e.save(),e.translate(f*.15,0),e.scale(.7,.55),h(),e.fillStyle=ch(u),e.fill(),e.restore(),e.save(),e.globalCompositeOperation="source-atop",e.strokeStyle=`rgba(${u*.34|0},${u*.56|0},${u*.24|0},0.5)`,e.lineWidth=Math.max(.35,f*.014),e.beginPath();for(let _=1;_<=7;_++){let T=_/8.5;for(let m of[-1,1])e.moveTo(f*T,0),e.lineTo(f*(T+.1),m*d*.9*Math.sin((T+.1)*Math.PI))}e.stroke(),e.strokeStyle=`rgba(${u*.78|0},${Math.min(255,u*1.02)|0},${u*.36|0},0.85)`,e.lineWidth=Math.max(.5,f*.024),e.beginPath(),e.moveTo(0,0),e.lineTo(f*.95,0),e.stroke(),e.restore(),e.restore()},a=yo(o.sprays,n,t,.2,100,172);for(let[s,l,c,f]of a){let u=n*(.26+t()*.1);e.strokeStyle="rgb(92,74,52)",e.lineWidth=1.4,e.beginPath(),e.moveTo(s,l),e.lineTo(s+Math.cos(c)*u,l+Math.sin(c)*u),e.stroke();for(let d=o.leaves-1;d>=0;d--){let h=(d+.6)/o.leaves,_=d%2?1:-1,T=(o.len[0]+t()*(o.len[1]-o.len[0]))*(1-.3*h);i(s+Math.cos(c)*u*h,l+Math.sin(c)*u*h,c+_*(.75+t()*.2)*(d===o.leaves-1?.15:1),T,f*(.92+t()*.16))}}r(e,2)}function GS(e,n,t,{dilate:r}){let o=IS,i=[];for(let a=0;a<o.twigs;a++)i.push([n*(.16+.68*((a+t()*.6)/o.twigs)),n*(.14+t()*.2),Math.PI/2+(t()-.5)*.5,n*(.42+t()*.22),78+t()*62]);i.sort((a,s)=>a[4]-s[4]);for(let[a,s,l,c,f]of i){e.strokeStyle="rgb(84,62,40)",e.lineWidth=1.6,e.beginPath(),e.moveTo(a,s),e.lineTo(a+Math.cos(l)*c,s+Math.sin(l)*c),e.stroke();for(let u=0;u<=o.needles;u++){let d=u/o.needles,h=a+Math.cos(l)*c*d,_=s+Math.sin(l)*c*d,T=(o.len[0]+t()*(o.len[1]-o.len[0]))*(1-.35*d);for(let m of[-1,1]){let p=l+m*(1+t()*.45),S=f+(t()-.5)*34;e.strokeStyle=yi(S,.5),e.lineWidth=2.2,e.beginPath(),e.moveTo(h,_),e.lineTo(h+Math.cos(p)*T,_+Math.sin(p)*T),e.stroke()}}e.strokeStyle=yi(f+70,.2),e.lineWidth=3,e.beginPath(),e.moveTo(a+Math.cos(l)*c*.94,s+Math.sin(l)*c*.94),e.lineTo(a+Math.cos(l)*c*1.04,s+Math.sin(l)*c*1.04),e.stroke()}r(e,1)}function kS(e,n,t,{dilate:r}){let o=NS;for(let[i,a,s,l]of yo(o.tufts,n,t,.33,86,150)){e.strokeStyle="rgb(120,84,52)",e.lineWidth=1.8,e.beginPath(),e.moveTo(i,a),e.lineTo(i-Math.cos(s)*16,a-Math.sin(s)*16),e.stroke();for(let c=0;c<o.needles;c++){let f=s+(t()-.5)*3.6,u=o.len[0]+t()*(o.len[1]-o.len[0]),d=l+(t()-.5)*40;e.strokeStyle=yi(d,1),e.lineWidth=1.9,e.beginPath(),e.moveTo(i,a),e.quadraticCurveTo(i+Math.cos(f)*u*.5+(t()-.5)*4,a+Math.sin(f)*u*.5+(t()-.5)*4,i+Math.cos(f)*u,a+Math.sin(f)*u),e.stroke()}}r(e,1)}function VS(e,n,t,{dilate:r}){let o=OS,i=[];for(let[a,s,l,c]of yo(o.sprays,n,t,.12,84,140)){let f=n*(.3+t()*.1);e.strokeStyle="rgb(96,72,50)",e.lineWidth=2,e.beginPath(),e.moveTo(a,s),e.lineTo(a+Math.cos(l)*f,s+Math.sin(l)*f),e.stroke();for(let u=0;u<o.rosettes;u++){let d=(u+.7)/o.rosettes,h=u%2?1:-1,_=(6+t()*9)*(1-.4*d),T=a+Math.cos(l)*f*d+Math.cos(l+h*1.25)*_,m=s+Math.sin(l)*f*d+Math.sin(l+h*1.25)*_;e.strokeStyle="rgb(96,72,50)",e.lineWidth=1.1,e.beginPath(),e.moveTo(a+Math.cos(l)*f*d,s+Math.sin(l)*f*d),e.lineTo(T,m),e.stroke();let p=c+(t()-.5)*36;for(let S=0;S<o.needles;S++){let M=S/o.needles*Math.PI*2+t()*.5,g=o.len[0]+t()*(o.len[1]-o.len[0]);e.strokeStyle=yi(p+(t()-.5)*24,.85),e.lineWidth=1.8,e.beginPath(),e.moveTo(T,m),e.lineTo(T+Math.cos(M)*g,m+Math.sin(M)*g),e.stroke()}i.length<o.cones&&t()<.1&&i.push([T,m])}}for(let[a,s]of i){e.fillStyle="rgb(150,160,120)",e.beginPath(),e.ellipse(a,s-9,6.5,10,0,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(96,104,72,0.9)",e.lineWidth=.9;for(let l=-2;l<=2;l++)e.beginPath(),e.moveTo(a-6,s-9+l*3.4),e.lineTo(a+6,s-9+l*3.4),e.stroke()}r(e,1)}var cr={holly:{paint:FS,seed:53,needles:!1},hawthorn:{paint:HS,seed:59,needles:!1},beech:{paint:BS,seed:61,needles:!1},spruce:{paint:GS,seed:71,needles:!0},scots:{paint:kS,seed:73,needles:!0},cedar:{paint:VS,seed:79,needles:!0}};var Je=e=>Number(e).toFixed(3),Lo=Xs.bark,hn=Xs.leaves;function Fe(e){return()=>{e|=0,e=e+1831565813|0;let n=Math.imul(e^e>>>15,1|e);return n=n+Math.imul(n^n>>>7,61|n)^n,((n^n>>>14)>>>0)/4294967296}}function Ml(e,n,t){let r=e.attributes.position,o=new Map;for(let i=0;i<r.count;i++){let a=`${r.getX(i).toFixed(3)},${r.getY(i).toFixed(3)},${r.getZ(i).toFixed(3)}`;o.has(a)||o.set(a,[(t()-.5)*n,(t()-.5)*n,(t()-.5)*n]);let[s,l,c]=o.get(a);r.setXYZ(i,r.getX(i)+s,r.getY(i)+l,r.getZ(i)+c)}return e.computeVertexNormals(),e}function zS(e,n,t,r=12,o=!1){let i=(o?[[.12,-n*.28],[e,-n*.46],[e*.45,n*.06],[.001,n*.5]]:[[.12,-n*.28],[e*.45,-n*.4],[e*.88,-n*.5],[e,-n*.46],[e*.62,-n*.1],[e*.3,n*.22],[.001,n*.5]]).map(([c,f])=>new je(c,f)),a=new ms(i,r).toNonIndexed(),s=Array.from({length:r+1},()=>.8+t()*.35);s[r]=s[0];let l=a.attributes.position;for(let c=0;c<l.count;c++){let f=l.getX(c),u=l.getZ(c),h=(Math.atan2(f,u)+Math.PI*2)%(Math.PI*2)/(Math.PI*2)*r,_=Math.floor(h),T=h-_,m=s[_]*(1-T)+s[(_+1)%r]*T,p=Math.min(1,Math.hypot(f,u)/e),S=1+(m-1)*p;l.setXYZ(c,f*S,l.getY(c)-(m-1)*p*n*.25,u*S)}return a.computeVertexNormals(),a}function Tl(e,n,t=12,r=!1){let o=Ve(e.map(([l,c,f,u,d])=>{let h=zS(l,c,n,t,r);h.scale(.88+n()*.24,1,.88+n()*.24),h.rotateY(n()*Math.PI),h.translate(u,f,d),Ml(h,.25,n),h.deleteAttribute("normal"),h.deleteAttribute("uv");let _=ml(h,.001);return _.computeVertexNormals(),_.toNonIndexed()})),i=an(o,e.length*3,n,{low:1,high:10}),a=i.attributes.normal,s=i.attributes.color;for(let l=0;l<s.count;l++){let c=1-WS*Math.max(0,-a.getY(l));s.setXYZ(l,s.getX(l)*c,s.getY(l)*c,s.getZ(l)*c)}return i}var WS=.45,Ah=.75;function Gi(e,n,t=!0,r=2,o=null,i=r){let a=Ve(e.map(([s,l,c,f])=>{let u=new ci(f,r),d=[.85+n()*.3,.8+n()*.3,.85+n()*.3];u.scale(...d);let h=i!==r?(Ml(new ci(f,i),.35,n),Fe(Math.round((s*31+l*17+c*13+f*7)*1e3)>>>0)):n,_=u.attributes.position;for(let m=0;m<_.count;m++)_.getY(m)<0&&_.setY(m,_.getY(m)*Ah);if(o&&u.scale(o.across,o.up,o.across),u.translate(s,l,c),Ml(u,.35,h),!t)return u;u.deleteAttribute("normal"),u.deleteAttribute("uv");let T=ml(u,.001);return T.computeVertexNormals(),T.toNonIndexed()}));return $S(an(a,e.length,n,{low:3,high:8}),e)}var XS=.8;function $S(e,n,t=XS){let r=e.attributes.normal;if(!r||n.length<2||t<=0)return e;let o=e.attributes.position,[i,a,s,l]=[0,0,0,0];for(let[u,d,h,_]of n){let T=_*_*_;i+=u*T,a+=d*T,s+=h*T,l+=T}let c=new ne,f=new ne;for(let u=0;u<o.count;u++)c.set(o.getX(u)-i/l,o.getY(u)-a/l,o.getZ(u)-s/l).normalize(),f.set(r.getX(u),r.getY(u),r.getZ(u)).lerp(c,t).normalize(),r.setXYZ(u,f.x,f.y,f.z);return e}function Rh(e,n){return yh(Nl(e,n),e.width,e.height)}function Nl(e,n){let{width:t,height:r}=e,o=e.getContext("2d").getImageData(0,0,t,r).data,[i,a,s]=KS(o,n),l=new Uint8Array(t*r*4);for(let c=0;c<r;c++){let f=(r-1-c)*t*4,u=c*t*4;for(let d=0;d<t*4;d+=4){let h=o[f+d+3],_=h>=YS;l[u+d]=_?o[f+d]:i,l[u+d+1]=_?o[f+d+1]:a,l[u+d+2]=_?o[f+d+2]:s,l[u+d+3]=h}}return l}function yh(e,n,t){let r=new Bn(e,n,t,Zt);return r.colorSpace=Lr,r.magFilter=St,r.minFilter=zt,r.generateMipmaps=!0,r.anisotropy=4,r.needsUpdate=!0,r}var YS=8;function KS(e,n){let t=0,r=0,o=0,i=0;for(let a=0;a<e.length;a+=4)e[a+3]<200||(t+=e[a],r+=e[a+1],o+=e[a+2],i++);return i?[Math.round(t/i),Math.round(r/i),Math.round(o/i)]:n}function Ch(e,n="cards",t=[1,1]){let r=new xn({side:qt,alphaTest:.45,...e}),o=`#define LEAF_GRID vec2(${(14*t[0]).toFixed(1)}, ${(14*t[1]).toFixed(1)})`;return r.onBeforeCompile=i=>{i.fragmentShader=i.fragmentShader.replace("#include <normal_fragment_begin>",`#include <normal_fragment_begin>
  normal = normalize( vNormal );`),Pe&&(i.fragmentShader=jS(i.fragmentShader.replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
        ${Ph}`),ZS),Nt||(i.fragmentShader=i.fragmentShader.replace("#include <map_fragment>",`#include <map_fragment>
${QS}`).replace("#include <common>",`#include <common>
${o}`)))},r.customProgramCacheKey=()=>Pe?`foliage-v7-close-${t[0]}x${t[1]}${Nt?"-p":""}`:"foliage-v1",Vn(r,n),nn(r,"foliage",{kind:n,high:Pe,grid:t})}var qS=.07,Ph=Nt?"float fNear = 0.0;":`float fNear = 1.0 - smoothstep(${Je(hn.full)}, ${Je(hn.fade)}, length(vViewPosition));`,ZS=`
		{
			float fBack = max( dot( -geometryViewDir, directLight.direction ), 0.0 );
			float fLobe = fBack * fBack;
			fLobe *= fLobe;
			reflectedLight.directDiffuse += diffuseColor.rgb * vec3( 1.0, 1.0, 0.8 ) * directLight.color * ( ( ${Je(qS)} + ${Je(hn.through)} * fNear ) * fLobe );
			if ( fNear > 0.0 ) {
				// The sun on the leaf's back comes through it; and a waxy glint.
				float fThrough = max( -dot( normal, directLight.direction ), 0.0 );
				float fGlint = pow( max( dot( reflect( -directLight.direction, normal ), geometryViewDir ), 0.0 ), 36.0 );
				reflectedLight.directDiffuse += directLight.color * fNear * ( diffuseColor.rgb * vec3( 1.0, 1.0, 0.75 ) * ${Je(hn.behind)} * fThrough + mix( diffuseColor.rgb, vec3( 1.0 ), 0.4 ) * ${Je(hn.glint)} * fGlint );
			}
		}`,fh=!1;function jS(e,n){let t=Ce.lights_fragment_begin,r="RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );",o=t.indexOf("DirectionalLight directionalLight;"),i=o<0?-1:t.indexOf(r,o);if(i<0)return fh||console.warn("Light through the leaves: three.js's lighting isn't as expected; none."),fh=!0,e;let a=i+r.length;return e.replace("#include <lights_fragment_begin>",`${t.slice(0,a)}
${n}${t.slice(a)}`)}var QS=`#ifdef USE_MAP
        {
          ${Ph}
          // (Gone where a leaf's patch is smaller than a few pixels, where
          // it was only sparkle that changed every frame.)
          float fSmall = 1.0 - smoothstep(0.25, 0.5, length(fwidth(vMapUv * LEAF_GRID)));
          if (fNear * fSmall > 0.0) {
            vec2 fCell = floor(vMapUv * LEAF_GRID);
            float fH = fract(sin(dot(fCell, vec2(12.9898, 78.233))) * 43758.5453);
            diffuseColor.rgb *= mix(vec3(1.0), vec3(1.0 - ${Je(hn.shade/2)} + ${Je(hn.shade)} * fH, 1.0 - ${Je(hn.shade/2.5)} + ${Je(hn.shade*.8)} * fH, 1.0 - ${Je(hn.shade/2)} + ${Je(hn.shade*.6)} * (1.0 - fH)), fNear * fSmall);
          }
        }
        #endif`,pn=(wt?4:2)/(Nt?2:1);function Po(e,n,t,r,o,i,a,s){e.save(),e.translate(n,t),e.rotate(r);let l=22,c=()=>{e.beginPath(),e.moveTo(0,0);for(let f=1;f<=l;f++){let u=f/l,d=Math.sin(u*Math.PI),h=a?.7+.3*Math.max(0,Math.sin(u*a*Math.PI)):1;e.lineTo(u*o,i*d*h)}for(let f=l;f>=0;f--){let u=f/l,d=Math.sin(Math.max(u,.001)*Math.PI),h=a?.7+.3*Math.max(0,Math.sin(u*a*Math.PI)):1;e.lineTo(u*o,-i*d*h)}e.closePath()};e.save(),e.globalCompositeOperation="source-atop",e.translate(o*.05,o*.06),c(),e.fillStyle=`rgba(18,30,12,${bl.shade})`,e.fill(),e.restore(),c(),e.fillStyle=`rgb(${s*.42|0},${s*.7|0},${s*.3|0})`,e.fill(),e.fillStyle=`rgb(${s*.6|0},${s*.95|0},${s*.42|0})`,e.save(),e.translate(o*.14,0),e.scale(.66,.5),e.fill(),e.restore(),e.strokeStyle=`rgba(${Math.min(255,s*.75)|0},${Math.min(255,s)|0},${s*.35|0},0.8)`,e.lineWidth=Math.max(.45,o*.02),e.beginPath(),e.moveTo(o*.08,0),e.lineTo(o*.88,0),e.stroke(),e.globalCompositeOperation="source-atop",e.lineWidth=Math.max(.3,o*.011),e.beginPath();for(let f of bl.veins){let u=i*Math.sin(f*Math.PI)*.62;for(let d of[-1,1])e.moveTo(o*f,0),e.lineTo(o*(f+.11),d*u)}e.stroke(),e.restore()}var bl={shade:.22,veins:[.28,.46,.64]};function uh(e,n){let t=Lh,r=(i,a,s)=>{let c=u=>a*(u<t.widest?Math.pow(u/t.widest,1.35):Math.pow(Math.max(0,(1-u)/(1-t.widest)),.55)),f=()=>{e.beginPath(),e.moveTo(0,0);for(let u=1;u<=18;u++)e.lineTo(u/18*i,c(u/18));for(let u=18;u>=0;u--)e.lineTo(u/18*i,-c(u/18));e.closePath()};e.save(),e.globalCompositeOperation="source-atop",e.translate(i*.04,i*.05),f(),e.fillStyle=`rgba(18,30,12,${bl.shade})`,e.fill(),e.restore(),f(),e.fillStyle=`rgb(${s*.42|0},${s*.7|0},${s*.3|0})`,e.fill(),e.save(),e.translate(i*.16,0),e.scale(.72,.52),f(),e.fillStyle=`rgb(${s*.6|0},${s*.95|0},${s*.42|0})`,e.fill(),e.restore(),e.save(),e.globalCompositeOperation="source-atop",e.strokeStyle=`rgba(${Math.min(255,s*.78)|0},${Math.min(255,s*1.02)|0},${s*.36|0},0.85)`,e.lineWidth=Math.max(.5,i*.022),e.beginPath(),e.moveTo(0,0),e.lineTo(i*.94,0),e.stroke(),e.strokeStyle=`rgba(${s*.3|0},${s*.5|0},${s*.2|0},0.45)`,e.lineWidth=Math.max(.35,i*.011),e.beginPath();for(let u=0;u<t.ribs;u++){let d=.2+u/t.ribs*.68;for(let h of[-1,1])e.moveTo(i*d,0),e.lineTo(i*(d+.09),h*c(d+.09)*.86)}e.stroke(),e.restore()};return(i,a,s,l,c)=>{e.save(),e.translate(i,a),e.rotate(s),e.strokeStyle=`rgb(${c*.5|0},${c*.62|0},${c*.28|0})`,e.lineWidth=1.3,e.beginPath(),e.moveTo(0,0),e.lineTo(-l*.5,0),e.stroke();let f=t.leaflets[0]+Math.floor(n()*(t.leaflets[1]-t.leaflets[0]+1)),u=Array.from({length:f},(d,h)=>h).sort((d,h)=>Math.abs(h-(f-1)/2)-Math.abs(d-(f-1)/2));for(let d of u){let h=f>1?d/(f-1)*2-1:0,_=l*(1-t.shorter*h*h)*(.94+n()*.12);e.save(),e.rotate(h*t.fan+(n()-.5)*.08),r(_,_*t.wide,c*(1-.14*Math.abs(h))*(.95+n()*.1)),e.restore()}e.restore()}}var Lh={hands:16,reach:[44,62],leaflets:[5,7],fan:1.75,shorter:.42,wide:.19,widest:.66,ribs:7,spread:.33},JS={rings:[[6,.1,.4,100,.2],[4,.04,.27,138,.9]]};function Co(e,n,t,{count:r,len:o,wid:i,lobes:a=0,v0:s,v1:l,spread:c=.34}){let f=[];for(let u=0;u<r;u++){let d=t()*Math.PI*2,h=n*c*Math.sqrt(t()),_=o[0]+t()*(o[1]-o[0]);f.push([n/2+Math.cos(d)*h,n/2+Math.sin(d)*h,t()*Math.PI*2,_,_*i,a,s+t()*(l-s)])}f.sort((u,d)=>u[6]-d[6]);for(let u of f)Po(e,...u)}var Dh=new Map;function Uh(e,n){return Dh.set(e,n),e.onUpdate=()=>{e.image.data=null},e}function JR(){for(let[e,n]of Dh)e.image.data=n(),e.needsUpdate=!0}var Ci=null;function Ih(e){if(Ci??={},Ci[e])return Ci[e];let n=Uh(Rh(Al(e),ki(e)),()=>Nl(Al(e),ki(e)));return e==="willow"&&(n.wrapS=cn,n.wrapT=cn),Ci[e]=n,n}var ki=e=>e==="pine"||cr[e]?.needles?[60,95,45]:e==="willow"?[110,130,60]:[80,115,50],at={cols:4,rows:4,kinds:["pine","leaf","birch","willowleaf","poplar","bush","oak","plane","chestnut","chestnutwhorl",...Object.keys(cr)]},Pi=null;function Ol(){if(Pi)return Pi;let{data:e,w:n,h:t}=dh();return Pi=Uh(yh(e,n,t),()=>dh().data),Pi}function dh(){let e=256*pn,n=e*at.cols,t=e*at.rows,r=new Uint8Array(n*t*4),[o,i,a]=ki("leaf");for(let s=0;s<n*t*4;s+=4)r[s]=o,r[s+1]=i,r[s+2]=a;return at.kinds.forEach((s,l)=>{let c=Nl(Al(s),ki(s)),f=l%at.cols*e,u=Math.floor(l/at.cols)*e;for(let d=0;d<e;d++)r.set(c.subarray(d*e*4,(d+1)*e*4),((u+d)*n+f)*4);Nh[s]=ex(c,e)}),{data:r,w:n,h:t}}var Li=.025,Nh={};function ex(e,n){let t=Math.ceil(Kl*255),[r,o,i,a]=[n,n,-1,-1];for(let s=0;s<n;s++)for(let l=0;l<n;l++)e[(s*n+l)*4+3]<t||(r=Math.min(r,l),i=Math.max(i,l),o=Math.min(o,s),a=Math.max(a,s));return i<0?null:[Math.max(0,r/n-Li),Math.max(0,o/n-Li),Math.min(1,(i+1)/n+Li),Math.min(1,(a+1)/n+Li)]}var tx=[[0,1],[1,1],[0,0],[1,0]];function nx(e,n){if(!e||!n)return e;Bl(e);let[t,r,o,i]=n,a=[[t,i],[o,i],[t,r],[o,r]],s=e.attributes.uv,l=Object.values(e.attributes);for(let c=0;c+3<s.count;c+=4)if(tx.every(([f,u],d)=>s.getX(c+d)===f&&s.getY(c+d)===u))for(let f of l)for(let u=0;u<f.itemSize;u++){let[d,h,_,T]=[0,1,2,3].map(m=>f.getComponent(c+m,u));a.forEach(([m,p],S)=>{let M=d+(h-d)*m,g=_+(T-_)*m;f.setComponent(c+S,u,g+(M-g)*p)})}for(let c of l)c.needsUpdate=!0;return e.boundingBox=null,e.boundingSphere=null,e}var Vt=(e,n)=>e==="leaf"&&kh.has(n)?"plane":mn[e].texture,Qr=e=>at.kinds.includes(e)?"leaves":e,wl=e=>at.kinds.includes(e)?Ol():Ih(e);function pr(e,n){if(!e)return e;let t=Math.max(0,at.kinds.indexOf(n)),r=e.attributes.position.count,o=new Float32Array(r*2);for(let i=0;i<r;i++)o[i*2]=t%at.cols/at.cols,o[i*2+1]=Math.floor(t/at.cols)/at.rows;return e.setAttribute("fCell",new Ge(o,2)),e}function Do(e,n,t=256*pn){let r=at.kinds.indexOf(n);if(!e||r<0||e.userData.atlas)return e;Ol(),nx(e,Nh[n]);let o=e.attributes.uv,i=.5/t,a=r%at.cols,s=Math.floor(r/at.cols);for(let l=0;l<o.count;l++)o.setXY(l,(a+i+o.getX(l)*(1-2*i))/at.cols,(s+i+o.getY(l)*(1-2*i))/at.rows);return o.needsUpdate=!0,e.userData.atlas=n,e}function Al(e){let t=document.createElement("canvas");t.width=t.height=256*pn;let r=t.getContext("2d",{willReadFrequently:!0});r.scale(pn,pn);let o=Fe(e==="pine"?5:e==="willow"?13:e==="oak"?9:e==="birch"?17:e==="poplar"?23:e==="bush"?29:e==="willowleaf"?31:e==="plane"?41:e==="chestnut"?43:e==="chestnutwhorl"?47:cr[e]?.seed??37);if(cr[e])cr[e].paint(r,256,o,{paintLeaf:Po,dilate:rn});else if(e==="willow"){for(let a=0;a<3;a++){let s=256*(.2+a*.3);for(let l=0;l<5;l++){let c=l/5*256,f=Math.PI/2+(o()-.5)*.15,u=256/5+20+o()*6,d=6.5,h=138+o()*55,_=s+(o()-.5)*12;Po(r,_,c,f,u,d,0,h),Po(r,_+(o()-.5)*16,c+u*.32,f+(o()-.5)*.2,u*.75,d*.8,0,h-15),c+u>254&&Po(r,_,c-256,f,u,d,0,h)}}rn(r,1)}else if(e==="pine"){for(let i=0;i<8;i++){let a=o()*Math.PI*2,s=256*(.3+o()*.4),l=256*(.3+o()*.4),c=256*(.22+o()*.1),f=s+Math.cos(a)*c,u=l+Math.sin(a)*c;r.strokeStyle="rgb(78,58,34)",r.lineWidth=2,r.beginPath(),r.moveTo(s,l),r.lineTo(f,u),r.stroke();for(let d=1;d<=18;d++){let h=d/18,_=s+(f-s)*h,T=l+(u-l)*h,m=14+o()*18,p=90+o()*60;for(let S of[-1,1]){let M=a+S*(.5+o()*.2);r.strokeStyle=`rgb(${p*.38|0},${p*.7|0},${p*.3|0})`,r.lineWidth=2.6,r.beginPath(),r.moveTo(_,T),r.lineTo(_+Math.cos(M)*m,T+Math.sin(M)*m),r.stroke()}}}rn(r,1)}else if(e==="oak"){let i=(a,s,l,c)=>{r.save(),r.translate(a,s),r.rotate(l);let f=3,u=c*.62;r.beginPath(),r.moveTo(0,0);for(let h=1;h<=28;h++){let _=h/28,T=Math.sin(_*Math.PI),m=.7+.3*Math.max(0,Math.sin(_*f*Math.PI));r.lineTo(_*c,u*T*m)}for(let h=28;h>=0;h--){let _=h/28,T=Math.sin(Math.max(_,.001)*Math.PI),m=.7+.3*Math.max(0,Math.sin(_*f*Math.PI));r.lineTo(_*c,-u*T*m)}r.closePath();let d=100+o()*70;r.fillStyle=`rgb(${d*.4|0},${d*.68|0},${d*.28|0})`,r.fill(),r.fillStyle=`rgb(${d*.58|0},${d*.94|0},${d*.4|0})`,r.save(),r.translate(c*.14,0),r.scale(.68,.52),r.fill(),r.restore(),r.strokeStyle=`rgba(${Math.min(255,d*.8)|0},${Math.min(255,d)|0},${d*.32|0},0.85)`,r.lineWidth=.9,r.beginPath(),r.moveTo(c*.08,0),r.lineTo(c*.88,0),r.stroke(),r.restore()};for(let a=0;a<22;a++){let s=o()*Math.PI*2,l=256*.34*Math.sqrt(o());i(256/2+Math.cos(s)*l,256/2+Math.sin(s)*l,o()*Math.PI*2,34+o()*28)}rn(r,2)}else if(e==="birch")Co(r,256,o,{count:26,len:[18,32],wid:.52,v0:165,v1:225,spread:.4}),rn(r,1);else if(e==="plane"){let i=(a,s,l,c,f)=>{r.save(),r.translate(a,s),r.rotate(l),r.beginPath();let u=60;for(let d=0;d<=u;d++){let h=-Math.PI*.92+d/u*Math.PI*1.84,_=Math.pow(Math.abs(Math.cos(h*2.5)),.7),T=c*(.38+.62*_)*(.75+.25*Math.cos(h*.5)),m=Math.cos(h)*T,p=Math.sin(h)*T;d?r.lineTo(m,p):r.moveTo(m,p)}r.lineTo(-c*.12,0),r.closePath(),r.fillStyle=`rgb(${f*.42|0},${f*.7|0},${f*.3|0})`,r.fill(),r.save(),r.scale(.66,.66),r.fillStyle=`rgb(${f*.6|0},${f*.95|0},${f*.42|0})`,r.fill(),r.restore(),r.strokeStyle=`rgba(${Math.min(255,f*.75)|0},${Math.min(255,f)|0},${f*.35|0},0.8)`,r.lineWidth=.8;for(let d of[0,.4,-.4,.8,-.8])r.beginPath(),r.moveTo(-c*.1,0),r.lineTo(Math.cos(d*Math.PI)*c*.85,Math.sin(d*Math.PI)*c*.85),r.stroke();r.beginPath(),r.moveTo(-c*.1,0),r.lineTo(-c*.55,0),r.stroke(),r.restore()};for(let a=0;a<18;a++){let s=o()*Math.PI*2,l=256*.34*Math.sqrt(o());i(256/2+Math.cos(s)*l,256/2+Math.sin(s)*l,o()*Math.PI*2,17+o()*11,100+o()*70)}rn(r,2)}else if(e==="chestnut"){let i=Lh,a=uh(r,o),s=[];for(let l=0;l<i.hands;l++){let c=o()*Math.PI*2,f=256*i.spread*Math.sqrt(o());s.push([256/2+Math.cos(c)*f,256/2+Math.sin(c)*f,o()*Math.PI*2,i.reach[0]+o()*(i.reach[1]-i.reach[0]),96+o()*78])}s.sort((l,c)=>l[4]-c[4]);for(let l of s)a(...l);rn(r,2)}else if(e==="chestnutwhorl"){let i=JS,a=uh(r,o),s=256/2;for(let[l,c,f,u,d]of i.rings)for(let h=0;h<l;h++){let _=d+h/l*Math.PI*2+(o()-.5)*.25;a(s+Math.cos(_)*256*c,s+Math.sin(_)*256*c,_,256*f*(.94+o()*.1),u+o()*30)}rn(r,2)}else e==="poplar"?(Co(r,256,o,{count:48,len:[22,40],wid:.42,v0:90,v1:155,spread:.4}),rn(r,1)):e==="bush"?(Co(r,256,o,{count:36,len:[18,34],wid:.7,v0:110,v1:175,spread:.4}),rn(r,1)):e==="willowleaf"?(Co(r,256,o,{count:20,len:[36,64],wid:.2,v0:130,v1:190,spread:.32}),rn(r,1)):(Co(r,256,o,{count:30,len:[28,50],wid:.46,v0:100,v1:170,spread:.38}),rn(r,2));return t}function rn(e,n){let{width:t,height:r}=e.canvas,o=e.getImageData(0,0,t,r);sh(o.data,o.data,t,r,n),e.save(),e.setTransform(1,0,0,1,0,0),e.putImageData(o,0,0),e.restore()}function rx(e,n,t,r){let o=n+t/2,i=t*.97,a=t*.04;e.strokeStyle="rgb(150,185,120)",e.lineWidth=2.2,e.beginPath(),e.moveTo(o,i),e.lineTo(o,a+6),e.stroke();let s=l=>t*.27*(l<.3?.4+.6*(l/.3):Math.pow((1-l)/.7,.75));for(let l=0;l<190;l++){let c=.05+.95*(l/190),f=s(c),u=o+(r()*2-1)*f,d=i+(a-i)*c+(r()-.5)*3,h=2.5+r()*1.6-c*.9,_=226+r()*29;e.fillStyle=`rgb(${_},${_},${_-6|0})`;for(let T=0;T<4;T++){let m=T/4*Math.PI*2+r()*1.5;e.beginPath(),e.arc(u+Math.cos(m)*h*.9,d+Math.sin(m)*h*.9,h,0,Math.PI*2),e.fill()}e.fillStyle=r()<.5?"rgb(235,200,90)":"rgb(225,120,135)",e.beginPath(),e.arc(u,d,h*.42,0,Math.PI*2),e.fill()}}var Di=null,Fl=2;function Oh(){if(Di)return Di;let e=128,n=document.createElement("canvas");n.width=e*pn*Fl,n.height=e*pn;let t=n.getContext("2d",{willReadFrequently:!0});t.scale(pn,pn),rx(t,e,e,Fe(67));let r=Fe(61);for(let o=0;o<110;o++){let i=r()*Math.PI*2,a=e*.4*Math.sqrt(r()),s=e/2+Math.cos(i)*a,l=e/2+Math.sin(i)*a,c=220+r()*35,f=2.4+r()*1.4;t.fillStyle=`rgb(${c},${c},${c})`;for(let u=0;u<5;u++){let d=u/5*Math.PI*2+r();t.beginPath(),t.arc(s+Math.cos(d)*f,l+Math.sin(d)*f,f*.85,0,Math.PI*2),t.fill()}t.fillStyle="rgb(120,110,80)",t.beginPath(),t.arc(s,l,f*.45,0,Math.PI*2),t.fill()}return Di=Rh(n,[200,200,200]),Di}function Fi(e,n,t,r,o=0){let i=[];for(let[a,s,l,c]of e)for(let f=0;f<n;f++){let u=(f+.5)/n,d=Math.acos(1-2*u)+(r()-.5)*.3,h=f*2.39996+r()*.5,_=new ne(Math.sin(d)*Math.cos(h),Math.cos(d),Math.sin(d)*Math.sin(h)),T=t*c*(.8+r()*.5),m=new Ct(T,T),p=new Xt().setFromUnitVectors(new ne(0,0,1),_);p.multiply(new Xt().setFromAxisAngle(new ne(0,0,1),r()*Math.PI*2)),m.applyQuaternion(p);let S=.85+r()*.25;o&&(S-=o*r()),_.y<0&&(S/=Math.hypot(_.x,_.z,_.y/Ah));let M=_.clone().multiplyScalar(c*S).add(new ne(a,s,l));m.translate(M.x,M.y,M.z);let g=m.attributes.position,E=m.attributes.normal;for(let b=0;b<g.count;b++){let R=new ne(g.getX(b)-a,g.getY(b)-s,g.getZ(b)-l).normalize();E.setXYZ(b,R.x,R.y,R.z)}i.push(m)}return an(Ve(i),i.length,r,{low:3,high:8.5})}function Rl(e,n,t,r){let o=[];for(let[i,a,s,l]of e)for(let c=0;c<n;c++){let f=r()*Math.PI*2,u=l*(.15+.9*Math.pow(r(),.5)),d=(r()-.28)*l,h=t*l*(.7+r()*.5),_=new Ct(h,h*(.8+r()*.3)),T=new ne(Math.cos(f),.25+r()*.55,Math.sin(f)).normalize(),m=new Xt().setFromUnitVectors(new ne(0,0,1),T);m.multiply(new Xt().setFromAxisAngle(new ne(0,0,1),r()*Math.PI)),_.applyQuaternion(m),_.translate(i+Math.cos(f)*u,a+d,s+Math.sin(f)*u);let p=_.attributes.position,S=_.attributes.normal;for(let M=0;M<p.count;M++){let g=new ne(p.getX(M)-i,(p.getY(M)-a)*.5+.45,p.getZ(M)-s).normalize();S.setXYZ(M,g.x,g.y,g.z)}o.push(_)}return an(Ve(o),o.length,r,{low:3,high:8.5})}var ox={out:[.8,.62],size:[.62,.45],drop:[.55,-.35]};function ix(e,n,t=ox){let[r,o,i,a,s]=e[0],l=e.at(-1);return[[r*t.size[0],o*.8,i-t.drop[0],a+Math.cos(n)*r*t.out[0],s+Math.sin(n)*r*t.out[0]],[r*t.size[1],o*.7,(i+l[2])/2-t.drop[1],a-Math.cos(n+.5)*r*t.out[1],s-Math.sin(n+.5)*r*t.out[1]]]}function xl(e,n,t,r,o,i,a){if(e!=="scots"||!r)return r;let s=ix(o,(n*7+t*13)%20*.314),l=s.map(([c,,f,u,d])=>[u,f,d,c]);return Ve([r,on(Kr(s,Fe(23559+a*101+t*31),i),l)])}function Kr(e,n,{every:t=1,grow:r=1,deep:o=null,under:i=0}={}){let a=oa(e),s=[];for(let[f,u,d,h,_]of a){let T=Math.max(3,Math.round(d/t));for(let m=0;m<T;m++){if(n()<.12)continue;let p=m/T*Math.PI*2+n()*.4,S=(1.5+f*.45)*(.8+n()*.4)*1.28*r,M=new Ct(S,S*.8);M.rotateX(-Math.PI/2+.55+n()*.2),M.translate(0,0,f*(o?o[0]+n()*(o[1]-o[0]):.55+n()*.15)),M.rotateY(-p),M.translate(h,u-.6+n()*.4,_);let g=M.attributes.position,E=M.attributes.normal;for(let b=0;b<g.count;b++){let R=new ne(g.getX(b)-h,.6,g.getZ(b)-_).normalize();E.setXYZ(b,R.x,R.y,R.z)}s.push(M)}}let l=an(Ve(s),s.length,n,{low:1,high:10});if(!i)return l;let c=sx(e,{count:i/t,grow:r});return Ve([l,lx(e,{count:i/t,grow:r}),...c?[c]:[]])}var fr={gap:.45,from:.3,to:.65,perMetre:2.5,least:4},ax=e=>(1.5+e*.45)*1.28*.8;function sx(e,{count:n=1,grow:t=1}={}){let r=Fe(Math.round(e.reduce((a,[s,l,c])=>a+s*131+l*17+c*7,0)*1e3)^28702),o=oa(e).sort((a,s)=>a[1]-s[1]),i=[];for(let a=1;a<o.length;a++){let[s,l,,c,f]=o[a-1],[u,d,,h,_]=o[a],T=(s+u)/2;if(d-l<=fr.gap*ax(T))continue;let[m,p,S]=[(l+d)/2,(c+h)/2,(f+_)/2],M=Math.max(fr.least,Math.round((fr.least+T*fr.perMetre)*n));for(let g=0;g<M;g++){let E=g/M*Math.PI*2+r()*.5,b=(1.5+T*.45)*(.8+r()*.4)*1.28*t,R=new Ct(b,b*.8);R.rotateX(-Math.PI/2+.55+r()*.2),R.translate(0,0,T*(fr.from+r()*(fr.to-fr.from))),R.rotateY(-E),R.translate(p,m-.6+r()*.4,S);let v=R.attributes.position,w=R.attributes.normal;for(let y=0;y<v.count;y++){let P=new ne(v.getX(y)-p,.6,v.getZ(y)-S).normalize();w.setXYZ(y,P.x,P.y,P.z)}i.push(R)}}return i.length?an(Ve(i),i.length,r,{low:1,high:10}):null}var Xn={perMetre:2.6,from:.3,to:.75,size:.8,shade:.72};function lx(e,{count:n=1,grow:t=1}={}){let r=Fe(Math.round(e.reduce((s,[l,c,f])=>s+l*131+c*17+f*7,0)*1e3)^3342),o=[];for(let[s,l,c,f,u]of e){let d=Math.max(3,Math.round(s*Xn.perMetre*n));for(let h=0;h<d;h++){if(r()<.1)continue;let _=h/d*Math.PI*2+r()*.5,T=Xn.from+r()*(Xn.to-Xn.from),m=(1.5+s*.45)*(.8+r()*.4)*1.28*Xn.size*t,p=new Ct(m,m*.8);p.rotateX(-Math.PI/2+.15+r()*.2),p.translate(0,0,s*T),p.rotateY(-_),p.translate(f,c-l*(.3+.22*T)-.1,u);let S=p.attributes.position,M=p.attributes.normal;for(let g=0;g<S.count;g++){let E=new ne(S.getX(g)-f,-.5,S.getZ(g)-u).normalize();M.setXYZ(g,E.x,E.y,E.z)}o.push(p)}}let i=an(Ve(o),o.length,r,{low:1,high:10}),a=i.attributes.color;for(let s=0;s<a.count;s++)a.setXYZ(s,a.getX(s)*Xn.shade,a.getY(s)*Xn.shade,a.getZ(s)*Xn.shade);return i}var Uo={pine:[{name:"dark green",hue:[.292,.347],sat:[.35,.45],light:[.24,.32],weight:4},{name:"blue-grey",hue:[.4,.46],sat:[.18,.3],light:[.3,.38],weight:1.5},{name:"deep",hue:[.31,.36],sat:[.3,.4],light:[.18,.24],weight:1},{name:"yellow-green",hue:[.25,.29],sat:[.3,.4],light:[.27,.33],weight:.9}],leaf:[{name:"mid green",hue:[.236,.292],sat:[.38,.5],light:[.3,.4],weight:4},{name:"fresh",hue:[.2,.25],sat:[.48,.6],light:[.36,.44],weight:2},{name:"deep",hue:[.27,.33],sat:[.35,.45],light:[.22,.29],weight:2},{name:"olive",hue:[.15,.2],sat:[.35,.45],light:[.3,.37],weight:1.2},{name:"silvery",hue:[.24,.3],sat:[.12,.22],light:[.38,.46],weight:.8},{name:"copper beech",hue:[.96,1],sat:[.25,.38],light:[.2,.27],weight:.25},{name:"lime",hue:[.19,.23],sat:[.5,.6],light:[.38,.45],weight:.7},{name:"blue-green",hue:[.3,.36],sat:[.26,.36],light:[.26,.33],weight:.9},{name:"turning",hue:[.09,.13],sat:[.5,.62],light:[.34,.42],weight:.12}],birch:[{name:"fresh",hue:[.19,.24],sat:[.45,.58],light:[.38,.46],weight:3},{name:"mid",hue:[.23,.27],sat:[.38,.5],light:[.33,.4],weight:2},{name:"turning",hue:[.12,.16],sat:[.5,.6],light:[.38,.45],weight:.3},{name:"deep",hue:[.24,.29],sat:[.35,.45],light:[.28,.34],weight:1}],willow:[{name:"yellow-green",hue:[.17,.22],sat:[.4,.55],light:[.38,.46],weight:3},{name:"silvery",hue:[.2,.26],sat:[.18,.3],light:[.4,.47],weight:1.5}],poplar:[{name:"deep",hue:[.26,.31],sat:[.35,.45],light:[.24,.3],weight:2},{name:"fresh",hue:[.22,.26],sat:[.42,.54],light:[.32,.4],weight:1.5},{name:"silvery",hue:[.22,.28],sat:[.14,.24],light:[.36,.43],weight:.6}],bush:[{name:"dark",hue:[.28,.34],sat:[.3,.42],light:[.2,.27],weight:3},{name:"glossy",hue:[.3,.36],sat:[.35,.48],light:[.24,.3],weight:2},{name:"yellow-green",hue:[.2,.24],sat:[.35,.48],light:[.28,.35],weight:1.5},{name:"golden",hue:[.14,.18],sat:[.5,.62],light:[.36,.44],weight:.6},{name:"blue-grey",hue:[.42,.48],sat:[.14,.24],light:[.3,.37],weight:.8},{name:"purple-leaved",hue:[.93,.99],sat:[.25,.38],light:[.2,.27],weight:.4},{name:"silvery",hue:[.24,.3],sat:[.1,.18],light:[.4,.47],weight:.4}],scots:[{name:"yellow-green",hue:[.22,.27],sat:[.28,.38],light:[.27,.34],weight:3},{name:"grey-green",hue:[.27,.32],sat:[.18,.28],light:[.28,.34],weight:1.5}],oak:[{name:"mid green",hue:[.22,.28],sat:[.35,.47],light:[.27,.36],weight:3},{name:"deep",hue:[.26,.31],sat:[.32,.42],light:[.22,.28],weight:2},{name:"olive",hue:[.16,.21],sat:[.32,.42],light:[.28,.34],weight:1},{name:"fresh",hue:[.2,.24],sat:[.42,.52],light:[.32,.4],weight:1}],column:[{name:"yew",hue:[.36,.42],sat:[.25,.36],light:[.15,.19],weight:3},{name:"cypress",hue:[.3,.36],sat:[.28,.38],light:[.16,.2],weight:1.5}],spruce:[{name:"blue-green",hue:[.38,.45],sat:[.2,.32],light:[.23,.3],weight:3},{name:"dark",hue:[.33,.39],sat:[.25,.35],light:[.2,.26],weight:1.5},{name:"silver-blue",hue:[.45,.5],sat:[.15,.25],light:[.32,.38],weight:.6}],snag:[{name:"bare twigs",hue:[.07,.12],sat:[.1,.18],light:[.3,.38],weight:1}],beech:[{name:"bright",hue:[.21,.26],sat:[.45,.56],light:[.3,.38],weight:3},{name:"deep",hue:[.24,.29],sat:[.36,.46],light:[.25,.31],weight:1.5},{name:"copper",hue:[.93,.98],sat:[.24,.34],light:[.16,.21],weight:.65}],chestnut:[{name:"dark",hue:[.27,.32],sat:[.38,.48],light:[.25,.31],weight:3},{name:"mid",hue:[.25,.29],sat:[.42,.52],light:[.3,.36],weight:1.5}],cedar:[{name:"blue-green",hue:[.36,.43],sat:[.18,.28],light:[.21,.27],weight:3},{name:"silvery",hue:[.4,.47],sat:[.12,.2],light:[.3,.36],weight:1}],holly:[{name:"dark glossy",hue:[.29,.35],sat:[.32,.44],light:[.16,.21],weight:3},{name:"variegated",hue:[.17,.22],sat:[.3,.42],light:[.3,.36],weight:.4}],hawthorn:[{name:"fresh",hue:[.21,.26],sat:[.4,.5],light:[.28,.35],weight:3},{name:"grey-green",hue:[.24,.29],sat:[.24,.34],light:[.27,.33],weight:1.2}]},cx={share:.0125};Uo.accent=[{name:"gold",hue:[.11,.14],sat:[.5,.62],light:[.36,.43],weight:1.2},{name:"copper",hue:[.03,.065],sat:[.42,.55],light:[.27,.33],weight:1}];var fx=new Set([ht.leaf,ht.birch,ht.willow,ht.poplar,ht.oak,ht.beech,ht.chestnut,ht.hawthorn]);Uo.autumn=[...Uo.accent,{name:"rust",hue:[.07,.095],sat:[.5,.62],light:[.3,.36],weight:1},{name:"red",hue:[0,.025],sat:[.45,.6],light:[.28,.34],weight:.5},{name:"turning",hue:[.15,.19],sat:[.45,.55],light:[.32,.38],weight:1.1}];Uo.dead=[{name:"dead leaves",hue:[.05,.1],sat:[.3,.42],light:[.24,.3],weight:1}];var Fh=[{name:"pink",hue:[.93,.97],sat:[.55,.75],light:[.72,.8],weight:3},{name:"magenta",hue:[.87,.92],sat:[.55,.7],light:[.55,.65],weight:1.5},{name:"white",hue:[.1,.16],sat:[.1,.3],light:[.9,.95],weight:2},{name:"lilac",hue:[.74,.8],sat:[.35,.55],light:[.7,.78],weight:1.5},{name:"red",hue:[.98,1],sat:[.6,.75],light:[.45,.52],weight:1},{name:"yellow",hue:[.13,.16],sat:[.75,.9],light:[.55,.62],weight:1.2},{name:"orange",hue:[.06,.09],sat:[.7,.85],light:[.55,.62],weight:.4}];function hr(e,n,t=new ye,r=Uo[e]){let o=n()*r.reduce((s,l)=>s+l.weight,0),i=r.find(s=>(o-=s.weight)<0)??r[0],a=([s,l])=>s+n()*(l-s);return t.setHSL(a(i.hue)%1,a(i.sat),a(i.light))}function an(e,n,t,{low:r=0,high:o=10}={}){let i=e.attributes.position,a=new Float32Array(i.count*3),s=i.count/n;for(let l=0;l<n;l++){let c=.84+t()*.28,f=(t()-.5)*.08;for(let u=Math.floor(l*s);u<Math.floor((l+1)*s);u++){let d=Math.min(1,Math.max(0,(i.getY(u)-r)/(o-r))),h=c*(.82+.22*d);a[u*3]=Math.min(1,h*(1+f)),a[u*3+1]=Math.min(1,h),a[u*3+2]=Math.min(1,h*(1-f))}}return e.setAttribute("color",new Ge(a,3)),e}var ux={foot:.82,crown:.5,from:0,to:.5,cool:[.02,.05]},dx={foot:.98,crown:.8,from:0,to:.5,cool:[.01,.05]},Hh=e=>qi(e,dx);function qi(e,n=ux){let t=to(n.from,n.to,e),r=n.foot+(n.crown-n.foot)*t,o=n.cool[0]+(n.cool[1]-n.cool[0])*t;return[r*(1-o),r,r*(1+o)]}var hx={high:1.5,arc:.42,tint:[.72,1.12,.6]};function px(e,n,t=hx){let r=1-to(t.high*.25,t.high,e),o=1-to(t.arc*.4,t.arc,Math.abs(n-.5)),i=r*o;return i<=0?null:t.tint.map(a=>1+(a-1)*i)}var dr={rings:4,fine:8,sides:6,fineSides:7,flare:[0,.2,.56,1],branch:[3,4]};function Yr(e,n=null,t="furrowed",r=!1,o=!1){let i=n===!0||n==="birch"||n==="smooth"?Hh:qi,a=o?null:i,s=o?null:()=>i(1);n===!0&&(n="birch");let l=Ln[t]??0,c=Fe(Math.round(e.height*1e3+e.a*100)),f=n==="birch"||n==="scots"||n==="plane",u=null,d=null;if(n==="birch"){let R=Array.from({length:84},()=>c()<.2?.28+c()*.2:1);u=(v,w,y)=>v<.12?.45+v*3:R[y%12*7+w%7],d=()=>.85}else if(n==="plane"){let R=Array.from({length:84},()=>{let v=c();return v<.25?[1.45,1.42,1.2]:v<.45?[1.1,1.15,.9]:v<.6?[1.15,1.15,1.15]:[1,1,1]});u=(v,w,y)=>R[y%12*7+w%7]}else if(n==="scots"){let R=[.62,.66,.78],v=Array.from({length:84},()=>.9+c()*.18);u=(w,y,P)=>{let D=Math.min(1,Math.max(0,(w-.3)/.35)),I=v[P%12*7+y%7];return R.map(L=>(L+(1-L)*D)*I)},d=()=>[1,.97,.95]}let h=u,_=(R,v,w,y)=>{let P=h?h(R,v,w):1,D=px(R*e.height,(v+.5)/y);if(!D)return P;let[I,L,H]=Array.isArray(P)?P:[P,P,P];return[I*D[0],L*D[1],H*D[2]]},T=r?f?dr.fine:dr.rings:f?wt?18:12:wt?7:6,m=Math.min(.5,dc(e)/e.height),p=(r?dr.flare:[0,.08,.2,.36,.56,.78,1]).map(R=>R*m);for(let R=1;R<=T;R++)p.push(m+(1-m)*(R/T));let S=r?f?dr.fineSides:dr.sides:wt?12:10,[M,g]=r?dr.branch:wt?[6,6]:[4,5],E=[Et(R=>An(e,R),R=>Mr(e,R),p.length-1,S,(R,v,w)=>_(R,v,w,S),l,{ts:p,flare:(R,v)=>hc(e,R,v),under:a})],b=0;for(let R of e.branches)if(R.stem){let v=++b*5;E.push(Et(w=>Tr(e,R,w),w=>br(R,w),T,S,u?(w,y,P)=>u(w,y,P+v):null,l,{under:a}))}else E.push(Et(v=>Tr(e,R,v),v=>br(R,v),M,g,d,l,{under:s}));return Ve(E)}var mx=1.2;function Et(e,n,t,r,o=null,i=0,{ts:a=null,flare:s=null,under:l=null}={}){let c=E=>a?a[E]:E/t,f=[],u=[],d=[],h=[],_=[],T=E=>{let b=e(E),R=e(Math.min(1,E+.02)),v=e(Math.max(0,E-.02)),w=new ne(R[0]-v[0],R[1]-v[1],R[2]-v[2]).normalize(),y=Math.abs(w.y)<.9?new ne(0,1,0):new ne(1,0,0),P=new ne().crossVectors(w,y).normalize(),D=new ne().crossVectors(w,P).normalize(),I=n(E),L=Math.hypot(R[0]-v[0],R[1]-v[1],R[2]-v[2])||1;return Array.from({length:r},(H,z)=>{let F=z/r*Math.PI*2,X=P.clone().multiplyScalar(Math.cos(F)).addScaledVector(D,Math.sin(F)),$=s?I*s(E,F):I,j=X;if(s){let Z=n(Math.min(1,E+.02))*s(Math.min(1,E+.02),F),ge=n(Math.max(0,E-.02))*s(Math.max(0,E-.02),F);j=X.clone().addScaledVector(w,(ge-Z)/L).normalize()}return{p:[b[0]+X.x*$,b[1]+X.y*$,b[2]+X.z*$],n:[j.x,j.y,j.z]}})},m=Array.from({length:t+1},(E,b)=>T(c(b))),p=wt?.68:mx,S=Math.max(1,Math.round(2*Math.PI*n(0)/p)),M=[0];for(let E=1;E<=t;E++){let[b,R,v]=e(c(E-1)),[w,y,P]=e(c(E));M.push(M[E-1]+Math.hypot(w-b,y-R,P-v))}for(let E=0;E<t;E++)for(let b=0;b<r;b++){let R=m[E][b],v=m[E][(b+1)%r],w=m[E+1][b],y=m[E+1][(b+1)%r],P=o?o((c(E)+c(E+1))/2,b,E):1,[D,I,L]=Array.isArray(P)?P:[P,P,P],[H,z]=l?[l(c(E)),l(c(E+1))]:[null,null],F=b/r*S,X=(b+1)/r*S,$=M[E]/p,j=M[E+1]/p;for(let[Z,ge,Ee,ze]of[[R,F,$,H],[v,X,$,H],[w,F,j,z],[v,X,$,H],[y,X,j,z],[w,F,j,z]])f.push(...Z.p),u.push(...Z.n),ze?d.push(D*ze[0],I*ze[1],L*ze[2]):d.push(D,I,L),h.push(ge,Ee),_.push(i)}let g=new xt;return g.setAttribute("position",new Yt(f,3)),g.setAttribute("normal",new Yt(u,3)),g.setAttribute("color",new Yt(d,3)),g.setAttribute("fBarkUv",new Yt(h,2)),g.setAttribute("fBarkKind",new Yt(_,1)),g}var gx=`
          float bNear = 1.0 - smoothstep(${Je(Lo.full)}, ${Je(Lo.fade)}, length(vViewPosition));
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
              bUv += bView * (h - 0.55) * ${Je(Lo.depth)} * bNear * 0.5;
            }
          }`;function _x(e){if(!Pe)return e;let n={tBark:bo().tBark};return e.onBeforeCompile=t=>{Object.assign(t.uniforms,n),t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
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
          ${gx}
          vec3 t = texture(tBark, vec3(bUv, layer)).rgb;
          vec3 tHi = texture(tBark, vec3(fract(bUv * 2.15), layer)).rgb;
          t = mix(t, min(t, tHi), bNear * 0.65);
          diffuseColor.rgb *= mix(1.0, 0.42 + 0.78 * t.r, k * 0.9);
          // (Close up, darker down in the cracks.)
          diffuseColor.rgb *= 1.0 - ${Je(Lo.cracks)} * bNear * (1.0 - smoothstep(0.15, 0.6, t.r));
          bLean = vec2(t.g * 2.0 - 1.0, 1.0 - t.b * 2.0) * k * (1.0 + ${Je(Lo.lean)} * bNear);
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
        }`)},e.customProgramCacheKey=()=>"bark-v4-ultra",e}var hh=.12,Ui={top:.2,under:.32},ur={span:2.6,between:.6,bright:1.1,fade:[70,130],average:[.243,.445,.119]};function vx(e,n,t=!1){n&&(e.alphaToCoverage=!0);let r=n?Ol():null;return e.onBeforeCompile=o=>{r&&(o.uniforms.tLeaves={value:r}),o.vertexShader=o.vertexShader.replace("#include <common>",`#include <common>
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
        float tCut = ${Je(Ui.top)} + ${Je(Ui.under-Ui.top)} * tUnder;
        float tEdge = fwidth(clumps) + 1e-4;
        float tCover = smoothstep(tCut - tEdge, tCut + tEdge, clumps);
        if (tCover <= 0.0) discard;
        diffuseColor.a *= tCover;`:""}
        // (Toned down beyond about 60 m, where it read as noise.)
        diffuseColor.rgb *= mix(0.78 + 0.4 * clumps, 0.97, smoothstep(45.0, 90.0, length(vViewPosition)));
        ${r?`// Its kind's leaves over it (CROWN_LEAVES), from the side it faces most.
        vec3 tAbs = abs(tFace);
        vec2 tQ = (tAbs.y >= tAbs.x && tAbs.y >= tAbs.z ? tAt.xz : tAbs.x >= tAbs.z ? tAt.zy : tAt.xy) / ${Je(ur.span)};
        vec2 tCellSize = vec2(${Je(1/at.cols)}, ${Je(1/at.rows)});
        vec2 tUv = vCell + (0.02 + fract(tQ) * 0.96) * tCellSize;
        vec4 tLeaf = textureGrad(tLeaves, tUv, dFdx(tQ) * tCellSize, dFdy(tQ) * tCellSize);
        vec3 tWorn = mix(vec3(${Je(ur.between)}), tLeaf.rgb / vec3(${ur.average.map(Je).join(", ")}) * ${Je(ur.bright)}, smoothstep(0.2, 0.6, tLeaf.a));
        diffuseColor.rgb *= mix(tWorn, vec3(1.0), smoothstep(${Je(ur.fade[0])}, ${Je(ur.fade[1])}, length(vViewPosition)));`:""}`).replace("#include <alphamap_fragment>",`#include <alphamap_fragment>
        ${t?"diffuseColor.rgb = mix(diffuseColor.rgb, vBark.rgb, vBark.a);":""}`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * ${Je(hh)} * tUnder${t?" * (1.0 - vBark.a)":""};`)},e.customProgramCacheKey=()=>`leafy-crown-v6-${n?"g":"s"}${t?"b":""}`,Vn(e,"crown"),nn(e,"crown",{gaps:n?Ui:null,bark:t,glow:hh,leaves:r?{map:r,cols:at.cols,rows:at.rows,...ur}:null})}var Bh=e=>Math.min(1,Math.max(0,(e-Xo[0])/(Xo[1]-Xo[0]))),ph=Bh(1),Vi={across:.82,up:.92},Sx=.68,Hl=e=>mn[e]?.under??Sx;function Bl(e,n=1,t=1){if(!e)return{r:0,y:0};if(!e.userData.reach){let i=e.attributes.position,a=0,s=0;for(let l=0;l<i.count;l++)a=Math.max(a,Math.hypot(i.getX(l),i.getZ(l))),s=Math.max(s,Math.abs(i.getY(l)));e.userData.reach={r:a,y:s}}let{r,y:o}=e.userData.reach;return{r:r*n,y:o*t}}function Gh(e){if(!e)return null;if(!e.userData.hull){let n=e.attributes.position,t=[];for(let r=0;r<n.count;r++)t.push([n.getX(r),n.getZ(r)]);e.userData.hull=Float32Array.from(wc(t).flat())}return e.userData.hull}var xx=.14,Ex=.035,mn={pine:{bark:"bark",texture:"pine",tex:"plates"},leaf:{bark:"bark",texture:"leaf",cards:24,size:1.22,boughs:!0,ends:{near:5,close:8,droop:.4,under:-.7,radius:[.5,.7]}},birch:{bark:"barkBirch",texture:"birch",cards:46,closeCards:30,size:1.18,drawn:{cards:30,size:1.18},trunk:"birch",tex:"birch"},willow:{bark:"barkWillow",texture:"willowleaf",cards:24,size:1.13,under:.85,ends:{near:3,close:5,droop:.5,up:.1}},poplar:{bark:"barkPoplar",texture:"poplar",cards:36,closeCards:27,size:1.3,drawn:{cards:27,size:1.22},ends:{near:3,close:5,droop:-.3,up:1.6,radius:[.36,.48]}},bush:{bark:"bark",texture:"bush",cards:21,size:1.22,crownDetail:1},scots:{bark:"barkScots",texture:"scots",trunk:"scots",tex:"plates"},oak:{bark:"barkOak",texture:"oak",cards:21,size:1.35,ends:{near:3.5,close:6,droop:.22,up:.55}},column:{bark:"bark",texture:"pine",tex:"plates"},spruce:{bark:"bark",texture:"spruce",tex:"plates"},snag:{bark:"barkSnag",texture:null},beech:{bark:"barkBeech",texture:"beech",trunk:"smooth",cards:44,closeCards:26,size:1.36,drawn:{cards:26,size:1.2},under:.82,tex:"plane",ends:{near:4.5,close:7,droop:.12,up:1.3,radius:[.46,.62]}},chestnut:{bark:"barkChestnut",texture:"chestnut",cards:22,size:1.42,under:.58,ends:{near:6,close:8,droop:.34,picture:"chestnutwhorl"}},cedar:{bark:"barkCedar",texture:"cedar",tex:"plates"},holly:{bark:"barkHolly",texture:"holly",cards:24,size:1,under:.85,tex:"plane",ends:{near:3.5,close:6,droop:.2,up:.3}},hawthorn:{bark:"barkHawthorn",texture:"hawthorn",cards:34,closeCards:20,size:1.15,drawn:{cards:20,size:1},under:.8,ends:{near:6,close:9,droop:.4,up:.3,under:-.9}}},Gl=e=>pc.has(ht[e]),mh=0,gh=1,kh=new Set([3,5,7]),mr=null,gr=null,_h=null,yl=()=>({kinds:dt,shapes:dt.map((e,n)=>mc(n)),high:Pe,extra:Pt,ultra:wt,phone:Nt,leafScale:pn,atlas:[at.cols,at.rows,at.kinds.length],blossomCells:Fl,candles:Qi,haws:Yn,pictures:Object.keys(cr),ends:[Ro,dt.map(e=>mn[e].ends??null)],crowns:dt.map(e=>mn[e].crownDetail??null),crownLeaves:1,...Ho?{fine:Zi.more}:{}});function e2(){return _h??=oh(ft,oo(["tree shapes",yl()])).then(e=>gr=e).catch(()=>null),_h}var Mx=e=>Object.fromEntries(Object.entries(e).map(([n,t])=>[n,t?{geometry:Ri(t),atlas:t.userData.atlas??null,...t.userData.blossomCell!=null?{blossomCell:t.userData.blossomCell}:{},...t.userData.cardCorners!=null?{cardCorners:t.userData.cardCorners}:{}}:null]));function Tx(e){return Object.fromEntries(Object.entries(e).map(([n,t])=>{if(!t)return[n,null];let r=_l(t.geometry);return t.atlas&&(r.userData.atlas=t.atlas),t.blossomCell!=null&&(r.userData.blossomCell=t.blossomCell),t.cardCorners!=null&&(r.userData.cardCorners=t.cardCorners),[n,r]}))}var bx=0;function Vh(e,n){let t=gr?.find(e,yl());if(t&&++bx===2&&!gr.changed&&(gr=null),t)return t.map(o=>o.map(Tx));let r=n();return gr?.keep(e,yl(),r.map(o=>o.map(Mx))),r}function t2(){let e=gr;gr=null,e?.changed&&ah(e)}function kl(){return mr??=Vh("tree shapes",zh),mr}function Vl(e,n,t,r){let o=gc(e,n);return t[o]??Fe(r+e*997+n*31)}function zh(){let e=Fe(334494),n=Fe(334495),t=Fe(334496),r=no(),o=dt.map((i,a)=>r[i].map((s,l)=>{let c=Vl(a,l,[e,n,t],334512),f=mn[i],u=Pt?Fe(790622+dt.indexOf(i)*997+l*31):null;if(Gl(i)){let w=Ln[f.tex]??0,y=Yr(s.trunk,f.trunk,f.tex),P=Pe?Bx(s,w):null,D=s.tiers.map(([$,,j,Z,ge])=>[Z,j,ge,$]),I={trunk:P?Ve([y,P]):y,crown:pr(Tl(s.tiers,c),f.texture),cards:Pe?xl(i,a,l,on(Kr(s.tiers,c,{under:1}),D),s.tiers,{under:1},1):null};if(Pt&&ro.has(a)&&(I.cardsHeart=xl(i,a,l,on(Kr(Wo(s.tiers,a),Wi(a,l),{under:1,every:1/zi(a)}),D),s.tiers,{under:1},2)),!u)return I;let L=Yr(s.trunk,f.trunk,f.tex,!0);I.trunkNear=P?Ve([L,P]):L;let H=Ox(),z=ro.has(a),F=z?Wo(s.tiers,a):s.tiers,X=z?H.every/(Io.coreCardsOf[a]??Io.coreCards):H.every;return{...I,limbs:Sh(I.trunk,Hx({...s,tiers:F},u,w)),cardsClose:xl(i,a,l,on(Kr(F,u,{...H,every:X,deep:$n.deep,under:1}),D),s.tiers,{...H,every:X*1.3,deep:$n.deep,under:1},3)}}if(s.snag)return{trunk:Yr(s.trunk,null,"furrowed",!1,!0),crown:null,cards:null,limbs:u?Gx(s.trunk,u,Ln.furrowed??0):null};let d=i==="willow"?s.spheres.slice(0,s.spheres.length-s.curtain):s.spheres,h=i==="leaf"&&kh.has(l)?["plane","plane"]:[f.trunk,f.tex],_=i==="birch"?Rl:Fi,T=i==="birch",m=u?Wh(s.trunk,d,u,Ln[h[1]]??0,T?.85:null,Fe(32284+dt.indexOf(i)*997+l*31),{plain:!T,limbs:!T}):null,p=Pt&&Zn.has(a)?Wi(a,l):null,S=Pe&&f.ends?{...Ro,...f.ends}:null,M=w=>S?on(lh(d,Fe(13313+a*997+l*31),Math.round(w*d.length),S),d):null,g=(w,y)=>{let P=f.boughs?Rx(s.trunk,d,Ln[h[1]]??0,y):null;return P?Ve([w,P]):w},E=T?yx(s.trunk,d,h):g(Yr(s.trunk,...h),!1),b=m?.geometry&&!T?g(Yr(s.trunk,...h,!0),!0):null,R=(w,y)=>zx(w,w?M(y):null,Vt(i,l),S?.picture??Vt(i,l));Pe&&f.drawn&&_(d,f.drawn.cards,f.drawn.size,c,f.fill||0);let v=f.drawn?Fe(7855+a*997+l*31):c;return Vx({trunk:E,trunkNear:b,crown:pr(Gi(d,c,!0,Pe?f.crownDetail??mh:2,Pe?Vi:null,Pe?gh:2),Vt(i,l)),cards:Pe?on(_(d,f.cards,f.size,v,f.fill||0),d):null,limbs:b?Sh(E,m.geometry):m?.geometry??null,cardsClose:u?on(Cx(Bi(a,d),_,Hi(Math.round((f.closeCards??f.cards)*(wt?4.2:2.4)*(Zn.has(a)?Xi(a).cards:1))),zl(f.size*(wt?.48:.64)*(Zn.has(a)?Xi(a).size:1)),u,f.fill||0,m.tips),d):null,core:(u||p)&&Zn.has(a)&&!T&&jn[Rn(a)].core<1?pr(Gi(Bi(a,d),u??p,!0,Pe?f.crownDetail??mh:2,Pe?Vi:null,Pe?gh:2),Vt(i,l)):null,cardsHeart:p?on(_(Bi(a,d),Math.max(3,Math.round(f.cards*zi(a))),f.size*Cl(a),p,f.fill||0),d):null,strands:i==="willow"?$x(s,c):null,blossom:Pe?s.flowering?Ll(Fi(Xx(s.spheres).map(([w,y,P,D])=>[w,y,P,D*1.12]),22,.65,c),0):a===ht.chestnut?kx(d,Fe(13258014+l*31)):a===ht.hawthorn?Ll(Fi(d.map(([w,y,P,D])=>[w,y,P,D*1.1]),Yn.cards,Yn.size,Fe(18997+l*31)),0):null:null},R,S??Ro)}));return o.forEach((i,a)=>i.forEach((s,l)=>[s.cards,s.cardsClose,s.cardsHeart].forEach(c=>Do(c,Vt(dt[a],l))))),o}var wx=1,zi=e=>(ro.has(e)?Io.coreCardsOf[e]??Io.coreCards:Xi(e).cards)*wx,Wi=(e,n)=>Fe(322087+e*997+n*31),Cl=e=>jn[Rn(e)].core<1?Xi(e).size:1,vh={rings:2,sides:4},Dn={tip:3,fork:2,small:1.4,out:[.72,.9],leaves:.35},Ax={most:4,below:[2.4,4.2],thick:.5,tip:.32,into:.85,least:.3};function Rx(e,n,t,r=!1,o=Ax){if(!n.length)return null;let i=Math.min(...n.map(([,d,,h])=>d-h*.8)),a=n.filter(([d,h,_,T])=>Math.hypot(d,_)>T*.45&&h-T<i+2.5).map(d=>({l:d,a:Math.atan2(d[2],d[0])})).sort((d,h)=>d.a-h.a);if(!a.length)return null;let s=Math.min(o.most,a.length),l=Array.from({length:s},(d,h)=>a[Math.floor(h*a.length/s)].l),[c,f]=r?dr.branch:[5,5],u=l.map(([d,h,_,T],m)=>{let p=Math.max(i*o.least,i-o.below[0]-(o.below[1]-o.below[0])*(m*.618%1)),S=Math.min(.95,p/e.height),M=An(e,S),g=[d,h-T*o.into,_],E=[M[0]+(g[0]-M[0])*.35,M[1]+(g[1]-M[1])*.7,M[2]+(g[2]-M[2])*.35],b=v=>[0,1,2].map(w=>(1-v)*(1-v)*M[w]+2*v*(1-v)*E[w]+v*v*g[w]),R=Mr(e,S)*o.thick;return Et(b,v=>R*(1-(1-o.tip)*v),c,f,null,t,{under:v=>qi(.45+.55*v)})});return Ve(u)}function Sh(e,n){let t=Ve([e,n]);return t.userData.trunk=(e.index?e.index.count:e.attributes.position.count)/3,t}function yx(e,n,t){let r=Wh(e,n,null,Ln[t[1]]??0,.85,null,{plain:!0}).geometry,o=Yr(e,...t);return r?Ve([o,r]):o}function Wh(e,n,t,r,o,i,{plain:a=!1,limbs:s=!0}={}){let f=[],u=[],d=o==null?null:()=>o,h=(_,T,m,p,S,M,g)=>{let[E,b,R,v]=n[T];for(let w=0;w<S;w++){let y=m+(S>1?(w/(S-1)-.5)*2*p:0)+(i()-.5)*.6,P=M[0]+i()*(M[1]-M[0]),D=v*(Dn.out[0]+i()*(Dn.out[1]-Dn.out[0])),I=Math.sqrt(1-P*P)*D,L=[E+Math.cos(y)*I,b+P*D,R+Math.sin(y)*I];f.push(Et(qr(_,L),H=>Math.max(.008,g*(1-.7*H)),1,3,d,r)),u.push([...L,T])}};for(let[_,[T,m,p,S]]of n.entries()){let M=Sc(e,[T*1,m*1,p*1]);if(!M)continue;let{at:g,end:E,r0:b}=M;if(a){f.push(Et(g,F=>Math.max(.025,b*(1-.75*F)),vh.rings,vh.sides,d,r));continue}s&&f.push(Et(g,F=>Math.max(.025,b*(1-.75*F)),3,5,d,r));let R=g(.65),v=t()*Math.PI*2,w=[E[0]+Math.cos(v)*S*1*.6,E[1]+S*1*(.2+t()*.4),E[2]+Math.sin(v)*S*1*.6];f.push(Et(F=>[0,1,2].map(X=>R[X]+(w[X]-R[X])*F),F=>Math.max(.015,b*.4*(1-.7*F)),2,4,d,r));let y=g(.35),P=v+Math.PI*(.7+t()*.6),D=[E[0]+Math.cos(P)*S*1*.75,E[1]-S*1*(.15+t()*.25),E[2]+Math.sin(P)*S*1*.75],I=F=>[0,1,2].map(X=>y[X]+(D[X]-y[X])*F+(X===1?Math.sin(F*Math.PI)*S*.25:0));f.push(Et(I,F=>Math.max(.015,b*.5*(1-.7*F)),3,4,d,r));let L=S*1<Dn.small?1:0,H=Math.max(.012,b*.22);h(E,_,i()*Math.PI*2,Math.PI*(1-1/Dn.tip),Dn.tip-L,[.35,.85],H),h((F=>[0,1,2].map(X=>R[X]+(w[X]-R[X])*F))(.55+i()*.3),_,v,.7,Dn.fork-L,[0,.5],H*.8),h(I(.55+i()*.3),_,P,.7,Dn.fork-L,[-.45,.1],H*.8)}return{geometry:f.length?Ve(f):null,tips:u}}function Cx(e,n,t,r,o,i,a){let s=[];return e.forEach((l,c)=>{let f=a.filter(h=>h[3]===c),u=Array.isArray(t)?t[c]:t,d=f.length?Math.max(1,Math.round(u*Dn.leaves/f.length)):0;s.push(n([l],u-d*f.length,r,o,i)),d&&s.push(Px(l,f,d,r,o))}),Ve(s)}function Px(e,n,t,r,o){let[i,a,s,l]=e,c=[];for(let[f,u,d]of n)for(let h=0;h<t;h++){let _=r*l*(.7+o()*.45),T=new ne(f+(o()-.5)*_*1.4,u+(o()-.5)*_,d+(o()-.5)*_*1.4),p=T.clone().sub(new ne(i,a,s)).normalize().clone().add(new ne(o()-.5,o()-.5,o()-.5).multiplyScalar(.9)).normalize(),S=new Ct(_,_),M=new Xt().setFromUnitVectors(new ne(0,0,1),p);M.multiply(new Xt().setFromAxisAngle(new ne(0,0,1),o()*Math.PI*2)),S.applyQuaternion(M),S.translate(T.x,T.y,T.z);let g=S.attributes.position,E=S.attributes.normal;for(let b=0;b<g.count;b++){let R=new ne(g.getX(b)-i,g.getY(b)-a,g.getZ(b)-s).normalize();E.setXYZ(b,R.x,R.y,R.z)}c.push(S)}return an(Ve(c),c.length,o,{low:3,high:8.5})}var Zi={more:1.6},Ho=Pt&&!!Cn(Gt("effects",{}),ft).fineleaves,Hi=e=>Ho?Math.max(1,Math.round(e*Zi.more)):e,zl=e=>Ho?e/Math.sqrt(Zi.more):e,wn={cards:{ultra:{end:18,side:12,inner:8,size:.8},high:{end:11,side:7,inner:5,size:1}},out:.5,inner:.8,under:.86,coreCards:.6,coreSize:1.15,birch:{cards:{ultra:{end:25,side:17,inner:12,size:.46},high:{end:20,side:14,inner:10,size:.62}},coreCards:.55,coreSize:1.1},poplar:{cards:{ultra:{end:14,side:9,inner:7,size:.62},high:{end:9,side:6,inner:4,size:.78}},coreCards:.6,coreSize:1.15,style:"upright"},bush:{cards:{ultra:{end:7,side:5,inner:4,size:.36},high:{end:5,side:3,inner:3,size:.46}},coreCards:.7,coreSize:1.05,style:"shell"},willow:{cards:{ultra:{end:5,side:4,inner:3,size:.62},high:{end:4,side:3,inner:2,size:.78}},coreCards:.65,coreSize:1.1,style:"curtain"},small:{cards:{ultra:{end:12,side:8,inner:6,size:.5},high:{end:8,side:5,inner:4,size:.62}},coreCards:.62,coreSize:1.12}},Io={cards:{ultra:{end:7,side:4,inner:4,size:1.15},high:{end:4,side:3,inner:3,size:1.4}},coreCards:.7,coreCardsOf:{[ht.scots]:.8,[ht.column]:.95}},ji=e=>e==="conifer"?Io:wn[e]??wn,Lx=(e="broad")=>{let n=ji(e).cards[wt?"ultra":"high"];return Ho?{...n,end:Hi(n.end),side:Hi(n.side),inner:Hi(n.inner),size:zl(n.size)}:n},Xi=e=>{let n=ji(Rn(e));return{cards:n.coreCards,size:n.coreSize}},Ii={};function Pl(e="broad"){if(Ii[e])return Ii[e];let n=ia(e),t=Lx(e),r=jn[e].radius,o=e==="birch",i=e==="conifer",a=e==="snag",s=Ln[o?"birch":i?"plates":"furrowed"]??0,l=n.map(f=>{let[u,d,h]=f.branch,_=p=>[0,1,2].map(S=>(1-p)*(1-p)*u[S]+2*p*(1-p)*d[S]+p*p*h[S]),T=o?()=>.85:null,m=[Et(_,p=>r.base+(r.tip-r.base)*p,3,o||a?3:4,T,s)];for(let[p,S]of f.twigs)m.push(Et(qr(p,S),M=>r.twig+(r.twigTip-r.twig)*M,1,3,T,s));return Ve(m)}),c=a?{}:$h(e,t,Xh[e]??65372);return Ii[e]={bark:l,leaves:c},Ii[e]}var Xh={birch:728924,conifer:790364,poplar:40796,bush:745308,willow:16220,small:5922652};function $h(e,n,t){let r=new Set;for(let a of wr)if(Rn(a)===e)for(let s=0;s<no()[dt[a]].length;s++)r.add(Vt(dt[a],s));let o=e==="birch"?"cloud":ji(e).style??"shell",i=ia(e).map((a,s)=>e==="conifer"?Nx(a,n,Fe(t+s*131)):o==="curtain"?Ix(a,n,Fe(t+s*131)):Ux(a,n,Fe(t+s*131),o));return Object.fromEntries([...r].map(a=>[a,i.map(s=>Do(Object.assign(s.clone(),{userData:{}}),a))]))}var Wl=(e,n,t)=>e.counts?e.counts[n]??0:n===0?e.end:n===t-1?e.inner:e.side,Dx={mid:{counts:[3,2,2,1],grow:1.2,spread:[.15,.65],bush:{counts:[2,1,1,1],grow:1},willow:{counts:[2,1,1,0]},conifer:{counts:[2,1,1,1],grow:1}},far:{counts:[1,1,0,0],grow:1.25,spread:[0,.35],willow:{counts:[1,1,0,0],grow:1.2},conifer:{counts:[1,1,0,0],grow:1.1}}},Ni={};function $i(e,n="mid"){let t=`${e}:${n}`;if(Ni[t])return Ni[t];let r=Dx[n],o=r[e]??{},i=ji(e).cards.high,a=o.grow??r.grow,s={counts:o.counts??r.counts,spread:o.spread??r.spread,size:i.size*a};return Ni[t]={leaves:e==="snag"?{}:$h(e,s,((Xh[e]??65372)^(n==="far"?4002:1053))>>>0)},Ni[t]}function Ux(e,n,t,r="shell"){let o=r==="cloud",i=r==="upright",a=new ne(...e.branch[0]),s=[],l=[],c=new ne,f=new ne,u=new ne;e.clumps.forEach(([m,p,S,M],g)=>{let E=Wl(n,g,e.clumps.length);c.set(m,p,S),u.copy(c).sub(a).normalize();for(let b=0;b<E;b++){let R=(b+.5)/E,v=Math.acos(1-2*R)+(t()-.5)*.4,w=b*2.39996+t()*.7,y=new ne(Math.sin(v)*Math.cos(w),Math.cos(v),Math.sin(v)*Math.sin(w)),P=n.size*(.8+t()*.5),D=new Ct(P,o?P*(.8+t()*.3):P),I=new Xt().setFromUnitVectors(new ne(0,0,1),y);I.multiply(new Xt().setFromAxisAngle(new ne(0,0,1),t()*Math.PI*2)),D.applyQuaternion(I);let L=y.clone().multiplyScalar(M*(n.spread?n.spread[0]+(n.spread[1]-n.spread[0])*(o?Math.sqrt(t()):t()):o?.15+.85*Math.sqrt(t()):.3+t()*.7)).add(c);o&&(L.y=p+(L.y-p)*1.8),i&&(L.y=p+(L.y-p)*1.5),D.translate(L.x,L.y,L.z);let H=D.attributes.position,z=D.attributes.normal;for(let F=0;F<H.count;F++)o?f.set(H.getX(F)-m,(H.getY(F)-p)*.5+.45*M,H.getZ(F)-S).normalize().lerp(u,wn.out*.6).normalize():f.set(H.getX(F)-m,H.getY(F)-p,H.getZ(F)-S).normalize().lerp(u,wn.out).normalize(),z.setXYZ(F,f.x,f.y,f.z);s.push(D),l.push(g)}});let d=an(Ve(s),s.length,t,{low:3,high:8.5}),h=d.attributes.position,_=d.attributes.color,T=h.count/s.length;for(let m=0;m<h.count;m++){let[p,S,M]=e.clumps[l[Math.floor(m/T)]];c.set(p,S,M),u.copy(c).sub(a).normalize(),f.set(h.getX(m)-p,h.getY(m)-S,h.getZ(m)-M).normalize();let g=(wn.inner+(1-wn.inner)*(.5+.5*f.dot(u)))*(wn.under+(1-wn.under)*(.5+.5*f.y));_.setXYZ(m,_.getX(m)*g,_.getY(m)*g,_.getZ(m)*g)}return d}function Ix(e,n,t){let r=new ne(...e.branch[0]),o=[];return e.clumps.forEach(([i,a,s,l],c)=>{let f=Wl(n,c,e.clumps.length),u=Math.atan2(s-r.z,i-r.x);for(let d=0;d<f;d++){let h=u+(d-(f-1)/2)*.45+(t()-.5)*.3,_=i+Math.cos(h)*l*(.3+t()*.5),T=s+Math.sin(h)*l*(.3+t()*.5),m=n.size*(.85+t()*.3),p=m*1.15,S=2+Math.floor(t()*2),M=a+l*(.4+t()*.4);for(let g=0;g<S;g++){let E=new Ct(m*(1-g*.12),p);E.translate(0,M-p/2,0),E.rotateY(-h+Math.PI/2);let b=l*.12*g;E.translate(_+Math.cos(h)*b,0,T+Math.sin(h)*b);let R=E.attributes.normal;for(let v=0;v<R.count;v++){let w=new ne(Math.cos(h),.25,Math.sin(h)).normalize();R.setXYZ(v,w.x,w.y,w.z)}o.push(E),M-=p*.82}}}),an(Ve(o),o.length,t,{low:.4,high:7})}function Nx(e,n,t){let r=new ne(...e.branch[0]),o=[],i=new ne,a=new ne;e.clumps.forEach(([u,d,h,_],T)=>{let m=Wl(n,T,e.clumps.length);i.set(u-r.x,0,h-r.z).normalize();let p=Math.atan2(i.z,i.x);for(let S=0;S<m;S++){let M=n.size*(.8+t()*.4),g=new Ct(M,M*.8);g.rotateX(-Math.PI/2+.45+t()*.25),g.translate(0,0,M*.2),g.rotateY(-(p+(t()-.5)*1.1)+Math.PI/2);let E=t()*Math.PI*2,b=_*(n.spread?n.spread[0]+(n.spread[1]-n.spread[0])*Math.sqrt(t()):Math.sqrt(t()));g.translate(u+Math.cos(E)*b,d+(t()-.6)*_*.5,h+Math.sin(E)*b);let R=g.attributes.position,v=g.attributes.normal;for(let w=0;w<R.count;w++)a.set(R.getX(w)-r.x,0,R.getZ(w)-r.z).normalize(),a.y=.6,a.normalize(),v.setXYZ(w,a.x,a.y,a.z);o.push(g)}});let s=an(Ve(o),o.length,t,{low:1,high:10}),l=s.attributes.position,c=s.attributes.color,f=Math.max(.001,...e.clumps.map(([u,,d])=>Math.hypot(u-r.x,d-r.z)));for(let u=0;u<l.count;u++){let d=Math.min(1,Math.hypot(l.getX(u)-r.x,l.getZ(u)-r.z)/f),h=wn.inner+(1-wn.inner)*d;c.setXYZ(u,c.getX(u)*h,c.getY(u)*h,c.getZ(u)*h)}return s}function Bi(e,n){return Zn.has(e)?n.map(([t,r,o,i])=>[t,r,o,i*jn[Rn(e)].core]):n}var El=new Map;function Yh(e,n,t,r,o){let i=Rn(e.kind),a=jn[i],s=no()[n][e.shape],l={close:[],near:[],far:[]};if(i==="snag"){let S=Pl(i).bark;for(let M of Mc(s,e.seed))l.near.push({role:"trunk",geometry:S[M.kit],matrix:e.matrix.clone().multiply(new $t().fromArray(M.matrix)),color:t.color,key:t.key});return l}let c=s.tiers?s.tiers.map(([S,,M,g,E])=>[g,M,E,S]):vc(s),f=`${e.kind}:${e.shape}`;El.has(f)||El.set(f,Kh(c));let u=El.get(f),d=Vt(n,e.shape),h=o?Pl(i):null,_=$i(i,"mid").leaves[d],T=$i(i,"far").leaves[d],m=new $t,p=i==="conifer"?Ec({trunk:s.trunk,tiers:s.tiers},e.seed,{kind:e.kind,toward:e.open}):xc({trunk:s.trunk,dome:c},e.seed,{kind:e.kind,toward:e.open});for(let S of p){let M=e.matrix.clone().multiply(m.fromArray(S.matrix)),[g,E,b]=S.clumps[0],R=qh(u,g,E,b),[v,w,y]=u.tints?Zh(u,g,E,b):[1,1,1],P=1+S.shade*a.shade.light,D=S.shade*a.shade.warm,I=r.color.clone();I.setRGB(I.r*R*v*P*(1+D),I.g*R*w*P,I.b*R*1.03*y*P*(1-D)),h&&(l.close.push({role:"limbs",geometry:h.bark[S.kit],matrix:M,color:t.color,key:t.key}),l.close.push({role:"cardsClose",geometry:h.leaves[d][S.kit],matrix:M,color:I,key:r.key})),l.near.push({role:"cards",geometry:_[S.kit],matrix:M,color:I,key:r.key}),l.far.push({role:"far",geometry:T[S.kit],matrix:M,color:I,key:r.key})}return l}var $n={arms:[5,9],reach:[.72,.88],cards:{ultra:{every:1/3,grow:.6},high:{every:1/2,grow:.72}},deep:[.3,.78]},Ox=()=>{let e=$n.cards[wt?"ultra":"high"];return Ho?{...e,every:e.every/Zi.more,grow:zl(e.grow)}:e};function Fx(e){let n=[0];for(let r=1;r<e.length;r++)n.push(n[r-1]+Math.hypot(e[r][0]-e[r-1][0],e[r][1]-e[r-1][1],e[r][2]-e[r-1][2]));let t=n.at(-1)||1;return r=>{let o=Math.min(1,Math.max(0,r))*t,i=1;for(;i<e.length-1&&n[i]<o;)i++;let a=(o-n[i-1])/(n[i]-n[i-1]||1);return[0,1,2].map(s=>e[i-1][s]+(e[i][s]-e[i-1][s])*a)}}var qr=(e,n)=>t=>[0,1,2].map(r=>e[r]+(n[r]-e[r])*t);function Hx(e,n,t){let{trunk:r,tiers:o}=e,i=[],a=An(r,1);for(let[s,l,c,f,u]of o){let d=c-l*.3,h=d<=a[1]?An(r,Math.max(0,d/r.height)):[f,d,u],_=Math.round(Math.min($n.arms[1],Math.max($n.arms[0],s*2.4))),T=n()*Math.PI*2,m=Math.min(.09,.03+s*.018);for(let p=0;p<_;p++){let S=T+p/_*Math.PI*2+(n()-.5)*.5,M=s*($n.reach[0]+n()*($n.reach[1]-$n.reach[0])),g=[f+Math.cos(S)*M,d-l*(.1+n()*.1),u+Math.sin(S)*M],E=[h[0]+(g[0]-h[0])*.45,Math.max(h[1],g[1])+l*.08,h[2]+(g[2]-h[2])*.45],b=R=>[0,1,2].map(v=>(1-R)*(1-R)*h[v]+2*R*(1-R)*E[v]+R*R*g[v]);if(i.push(Et(b,R=>Math.max(.012,m*(1-.8*R)),2,3,null,t)),n()<.7){let R=b(.5),v=S+(n()<.5?-1:1)*(.5+n()*.4),w=M*.35;i.push(Et(qr(R,[R[0]+Math.cos(v)*w,R[1]-l*.06,R[2]+Math.sin(v)*w]),y=>Math.max(.01,m*.45*(1-.7*y)),1,3,null,t))}}}return Ve(i)}function Bx(e,n){let{trunk:t,tiers:r}=e,o=An(t,1),i=r.reduce((c,f)=>f[2]+f[1]*.5>c[2]+c[1]*.5?f:c),a=[o,...[...r].sort((c,f)=>c[2]-f[2]).filter(c=>c[2]>o[1]+.3).map(([,,c,f,u])=>[f,c,u])],s=i[2]+i[1]*.2;if(s>a.at(-1)[1]+.3&&a.push([i[3],s,i[4]]),a.length<2)return null;let l=Mr(t,1);return Et(Fx(a),c=>Math.max(.02,l*(1-.85*c)),Math.max(2,(a.length-1)*2),6,null,n)}function Gx(e,n,t){let r=[];for(let s of e.branches){let l=n()<.6?2:1;for(let c=0;c<l;c++){let f=.55+n()*.3,u=Tr(e,s,f),d=s.b+(n()-.5)*1.6,h=s.len*(.18+n()*.12),_=[u[0]+Math.cos(d)*h*.6,u[1]+h*(.6+n()*.35),u[2]+Math.sin(d)*h*.6],T=br(s,f)*.55;r.push(Et(qr(u,_),m=>Math.max(.012,T*(1-.75*m)),2,4,null,t))}}let o=3+Math.floor(n()*3);for(let s=0;s<o;s++){let l=.15+n()*.6,c=An(e,l),f=n()*Math.PI*2,u=Mr(e,l),d=u+.15+n()*.3;r.push(Et(qr(c,[c[0]+Math.cos(f)*d,c[1]+d*(.2+n()*.4),c[2]+Math.sin(f)*d]),h=>u*.35*(1-.5*h),2,5,null,t))}let i=An(e,1),a=3+Math.floor(n()*3);for(let s=0;s<a;s++){let l=s/a*Math.PI*2+n()*.6,c=[i[0]+Math.cos(l)*e.r1*.6,i[1]-.15,i[2]+Math.sin(l)*e.r1*.6],f=.2+n()*.3;r.push(Et(qr(c,[c[0]+Math.cos(l)*.06,c[1]+f,c[2]+Math.sin(l)*.06]),u=>Math.max(.006,e.r1*.35*(1-u)),2,3,null,t))}return Ve(r)}var _r={heart:.62,under:.72,round:.5,patch:.09};function Kh(e){let n=0,t=0,r=0;for(let[l,c,f]of e)n+=l/e.length,t+=c/e.length,r+=f/e.length;let o=0,i=1/0,a=-1/0;for(let[l,c,f,u]of e)o=Math.max(o,Math.hypot(l-n,c-t,f-r)+u),i=Math.min(i,c-u),a=Math.max(a,c+u);let s=_r.patch&&e.length>1?e.map(([l,c,f])=>{let d=(Math.abs(Math.sin(l*12.9898+c*78.233+f*37.719)*43758.5453)%1*2-1)*_r.patch;return[1+d*1.2,1+d*.5,1-d*1.4]}):null;return{cx:n,cy:t,cz:r,reach:o,lo:i,hi:a,tints:s,dome:e}}function qh(e,n,t,r){let o=Math.min(1,Math.hypot(n-e.cx,t-e.cy,r-e.cz)/(e.reach||1)),i=Math.min(1,Math.max(0,(t-e.lo)/(e.hi-e.lo||1)));return(_r.heart+(1-_r.heart)*o**1.5)*(_r.under+(1.08-_r.under)*i)}function Zh(e,n,t,r){let o=0,i=1/0;for(let a=0;a<e.dome.length;a++){let[s,l,c,f]=e.dome[a],u=Math.hypot(n-s,t-l,r-c)/(f||1);u<i&&(i=u,o=a)}return e.tints[o]}function on(e,n){if(!e||!n.length)return e;let t=Kh(n),r=e.attributes.position,o=e.attributes.color;for(let a=0;a<r.count;a++){let s=qh(t,r.getX(a),r.getY(a),r.getZ(a));o.setXYZ(a,Math.min(1,o.getX(a)*s),Math.min(1,o.getY(a)*s),Math.min(1,o.getZ(a)*s*1.03))}if(t.tints)for(let a=0;a<r.count;a++){let[s,l,c]=Zh(t,r.getX(a),r.getY(a),r.getZ(a));o.setXYZ(a,Math.min(1,o.getX(a)*s),Math.min(1,o.getY(a)*l),Math.min(1,o.getZ(a)*c))}let i=e.attributes.normal;if(i){let a=new ne,s=new ne;for(let l=0;l<r.count;l++)s.set(r.getX(l)-t.cx,r.getY(l)-t.cy,r.getZ(l)-t.cz).normalize(),a.set(i.getX(l),i.getY(l),i.getZ(l)).lerp(s,_r.round).normalize(),i.setXYZ(l,a.x,a.y,a.z)}return e}function Ll(e,n,t=128*pn){if(!e||e.userData.blossomCell!=null)return e;let r=e.attributes.uv,o=.5/t;for(let i=0;i<r.count;i++)r.setX(i,(n+o+r.getX(i)*(1-2*o))/Fl);return r.needsUpdate=!0,e.userData.blossomCell=n,e}var Qi={most:24,apart:1.25,from:.12,out:1.07,height:1.12,width:.62,sunk:.12,lean:.22,share:.8,pink:.14,lit:.55,low:.74};function kx(e,n){let t=Qi,r=[];for(let[s,l,c,f]of e){let u=Math.max(6,Math.round(f*f*3.2));for(let d=0;d<u;d++){let h=t.from+(1-t.from)*((d+n())/u),_=d*2.39996+n()*.8,T=Math.sqrt(Math.max(0,1-h*h)),m=[T*Math.cos(_),h,T*Math.sin(_)],p=[s+m[0]*f*t.out,l+m[1]*f*t.out,c+m[2]*f*t.out];e.some(([S,M,g,E])=>(S!==s||M!==l||g!==c)&&Math.hypot(p[0]-S,p[1]-M,p[2]-g)<E*1.04)||r.push({at:p,dir:m,pick:n()})}}r.sort((s,l)=>s.pick-l.pick);let o=[];for(let s of r){if(o.length>=t.most)break;o.every(l=>Math.hypot(l.at[0]-s.at[0],l.at[1]-s.at[1],l.at[2]-s.at[2])>=t.apart)&&o.push(s)}if(!o.length)return null;let i=new ne(0,1,0),a=[];for(let{at:s,dir:l}of o){let c=.85+n()*.35,f=n()*Math.PI,u=new ne(l[0],0,l[2]),d=u.lengthSq()>1e-6?new ne().crossVectors(i,u.normalize()):new ne(1,0,0),h=new Xt().setFromAxisAngle(d.normalize(),t.lean*(1-l[1])),_=new ne(l[0]*t.lit,1,l[2]*t.lit).normalize(),T=(.9+n()*.1)*(t.low+(1-t.low)*l[1]);for(let m of[0,Math.PI/2]){let p=new Ct(t.width*c,t.height*c);p.translate(0,t.height*c*.5-t.sunk,0),p.rotateY(f+m),p.applyQuaternion(h),p.translate(s[0],s[1],s[2]);let S=p.attributes.normal;for(let M=0;M<S.count;M++)S.setXYZ(M,_.x,_.y,_.z);p.setAttribute("color",new Ge(new Float32Array(S.count*3).fill(T),3)),a.push(p)}}return Ll(Ve(a),1)}function Vx(e,n,t){return e.cards&&(e.cards=n(e.cards,t.near)),e.cardsHeart&&(e.cardsHeart=n(e.cardsHeart,t.near)),e.cardsClose&&(e.cardsClose=n(e.cardsClose,t.close)),e}function zx(e,n,t,r){if(!e||!n)return e;Do(e,t),Do(n,r);let o=Ve([e,n]);return o.userData.atlas=t,o.userData.cardCorners=e.attributes.position.count,o}var Yn={cards:5,size:.36,may:.9,pink:.12,haws:.55,autumn:.85,dull:.5};function Wx(e,n,t){if(e===ht.chestnut){let r=Fe(n^13258014);return{color:jh(r),on:(t==="summer"||t==="spring")&&r()<Qi.share}}if(e===ht.hawthorn){let r=Fe(n^18997),o=new ye;return t==="spring"?(r()<Yn.pink?o.setHSL(.94+r()*.03,.5,.82):o.setHSL(.14,.2+r()*.15,.93),{color:o,on:r()<Yn.may}):(o.setHSL((.985+r()*.03)%1,.62+r()*.12,(.36+r()*.07)*Yn.dull),{color:o,on:r()<(t==="autumn"?Yn.autumn:Yn.haws)})}return null}function jh(e,n=new ye){return e()<Qi.pink?n.setHSL(.955+e()*.03,.5+e()*.15,.7+e()*.06):n.setHSL(.13+e()*.03,.3+e()*.2,.9+e()*.04)}function Xx(e){let n=e.reduce((t,r)=>t+r[1],0)/e.length;return e.filter(t=>t[1]>=n-.05)}function $x(e,n){let t=[],r=e.spheres.slice(0,e.spheres.length-e.curtain);for(let[o,i,a,s]of r){let l=Math.atan2(a,o),c=7;for(let f=0;f<c;f++){let u=l+(f-(c-1)/2)*.24+(n()-.5)*.2,d=o+Math.cos(u)*s*(.5+n()*.28),h=a+Math.sin(u)*s*(.5+n()*.28),_=i+s*(.2+n()*.35),T=_-(.4+n()*.45),m=n()<.4?T*(.28+n()*.3):T,p=_-m;if(m<1.2)continue;let S=.95+n()*.5,M=new Ct(S,m,1,5),g=M.attributes.position,E=s*(.18+n()*.3);for(let w=0;w<g.count;w++){let y=g.getY(w)/m+.5;g.setX(w,g.getX(w)*(.82+.35*y)),g.setZ(w,Math.sin((1-y)*Math.PI*.55)*E)}M.translate(0,(_+p)/2,0),M.rotateY(-u+Math.PI/2),M.translate(d,0,h);let b=M.attributes.uv,R=Math.max(2,m/.9);for(let w=0;w<b.count;w++)b.setY(w,b.getY(w)*R);let v=M.attributes.normal;for(let w=0;w<g.count;w++){let y=new ne(g.getX(w),.25,g.getZ(w)).normalize();v.setXYZ(w,y.x,y.y,y.z)}t.push(M)}}return t.length?an(Ve(t),t.length,n,{low:.4,high:7}):null}var yt={cardShare:.25,cardGrow:1.9,birchGrow:1.8,pineEvery:3,pineGrow:1.5,sides:6,rings:3};function Yx(e,n,t,r=ht[e],o=0){let i=mn[e],a=Ln[i.tex??"furrowed"]??0,s=e==="birch"||e==="beech"?Hh:qi,l=(v,w,y,P=1.05,D=s)=>Et(I=>An(v,I),I=>Mr(v,I)*P,w,y,null,a,{under:D});if(n.snag){let v=n.trunk.branches.map(w=>Et(y=>Tr(n.trunk,w,y),y=>br(w,y)*1.2,1,4,null,a));return{trunk:Ve([l(n.trunk,yt.rings,yt.sides,1.1,null),...v]),crown:null,cards:null}}let c=n.trunk.branches.filter(v=>v.stem).map(v=>Et(w=>Tr(n.trunk,v,w),w=>br(v,w)*1.05,yt.rings,yt.sides,null,a,{under:s})),f=c.length?Ve([l(n.trunk,yt.rings,yt.sides),...c]):l(n.trunk,yt.rings,yt.sides);if(Gl(e)){let v=n.tiers.map(([y,,P,D,I])=>[D,P,I,y]),w={trunk:f,crown:pr(Tl(n.tiers,t,yt.sides,!0),i.texture),cards:Pe?on(Kr(n.tiers,t,{every:yt.pineEvery,grow:yt.pineGrow}),v):null};if(Pt&&ro.has(r)){let y=Wi(r,o),P=Wo(n.tiers,r);w.crownHeart=pr(Tl(P,y,yt.sides,!0),i.texture),w.cardsHeart=on(Kr(P,y,{every:yt.pineEvery/zi(r),grow:yt.pineGrow}),v)}return w}let u=i.drawn??i,d=Math.max(3,Math.round((u.cards??12)*yt.cardShare)),h=e==="willow"?n.curtain??0:0,_=n.spheres.slice(0,n.spheres.length-h),T=n.spheres.slice(n.spheres.length-h),m=(v,w,y=t)=>Fi(v,w,u.size*yt.cardGrow*(y===t?1:Cl(r)),y,i.fill||0),p=Pe?on(e==="birch"?Rl(n.spheres,d+1,u.size*yt.birchGrow,t):T.length?Ve([m(_,d),m(T,Math.max(2,d>>1))]):m(_,d),_):null,S=e==="birch"&&Pe?null:pr(Gi(n.spheres,t,!0,Pe?0:1,Pe?Vi:null),Vt(e,o));if(!Pt||!Zn.has(r))return{trunk:f,crown:S,cards:p};let M=Wi(r,o),g=Bi(r,_),E=Math.max(2,Math.round(d*zi(r))),b=on(e==="birch"?Rl(g,E+1,u.size*yt.birchGrow*Cl(r),M):T.length?Ve([m(g,E,M),m(T,Math.max(2,d>>1),M)]):m(g,E,M),_),R=e==="birch"||jn[Rn(r)].core>=1?null:pr(Gi([...g,...T],M,!0,0,Vi),Vt(e,o));return{trunk:f,crown:S,cards:p,cardsHeart:b,crownHeart:R}}var Zr=null;function Xl(){return Zr??=Vh("low tree shapes",Qh),Zr}function Qh(){let e=Fe(4004),n=Fe(4005),t=Fe(4006),r=no(),o=dt.map((i,a)=>r[i].map((s,l)=>Yx(i,s,Vl(a,l,[e,n,t],64176),a,l)));return o.forEach((i,a)=>i.forEach((s,l)=>[s.cards,s.cardsHeart].forEach(c=>Do(c,Vt(dt[a],l))))),o}function xh(e,n,t){let r=[["far",n.trunk,e.matrix,new ye(pt[mn[t].bark]),"bark"]];if(n.cards){n.crown&&r.push(["far",n.crown,e.matrix,e.color.clone().multiplyScalar(Hl(t)),"crown"]);let o=Vt(t,e.shape);r.push(["far",n.cards,e.matrix,Fo(e.color,o),Qr(o)])}else n.crown&&r.push(["far",n.crown,e.matrix,e.color,"crown"]);return r}var jr=!0;function n2(e){jr=!!e}function r2(){return jr}var[Kn,Dl,Eh,Mh]=[vi,Vs,Bu,Gu].map(e=>Nt?Hu(e):e),Jr=Kn[ft];un(2,"3D trees to 220 m",e=>Jr=e?Kn.medium:Kn.high,{of:"high"});var Jh=()=>!Nt&&!!Vu[ft]&&Jr===Kn[ft];function o2(){return Jh()}var $l=new Set;function i2(e){return e&&($l.add(e),e.visible=!Zf(),e)}un(1.5,"no neighbour trees",e=>{jf(e);for(let n of $l)n.visible=!e},{of:"high"});var ep=!1,Ji=!1,Yl=()=>!Pt||ep?0:wt&&!Ji?Dl.ultra:Dl.high,Kx=()=>Yl()?wt&&!Ji?Eh.ultra:Eh.high:0,qx=()=>wt&&!Ji?Mh.ultra:Mh.high,Zx=()=>!Nt&&wt&&!!ku.ultra&&Yl()===Dl.ultra;un(2,"close-up trees to 45 m",e=>Ji=e,{of:"ultra"});un(.75,"no close-up trees",e=>ep=e,{of:"high"});un(2,"simpler far trees",e=>{Jr=e?Kn.standard:Kn.medium});un(2.6,"3D trees only near the shot",e=>{Jr=e?Kn.least:Kn.standard});var Kl=.2;function Th(e,n="cards"){let t=Qr(e)==="leaves"?[at.cols,at.rows]:[1,1];return Ch({map:wl(e),vertexColors:!0,alphaToCoverage:!0,alphaTest:Kl},n,t)}function a2(e,{groundY:n=()=>0,seed:t=11,shadows:r=!0,forms:o=null,farOnly:i=!1,front:a=null,own:s=null,facing:l=null}={}){let c=new cs,f=Pe,u=i?null:kl(),d=i?Xl():null,h=new Xt,_=new Xt,T=new ne(0,1,0),m=new ne,p=[],S=Zd(e),M=e.map((E,b)=>{let R=o?.[b]??Tc(E),[v,w]=E,y=Number.isInteger(R.shape)?R.shape%((i?d:u)[R.kind]?.length??uc):0;h.setFromAxisAngle(T,R.yaw??0),_.setFromAxisAngle(m.set(Math.cos(R.leanA??0),0,Math.sin(R.leanA??0)),R.lean??0);let P=new $t().compose(new ne(v,n(v,w)-.2,w),_.clone().multiply(h),new ne(R.w*(R.sx??1),R.h,R.w*(R.sz??1))),D=Bh(R.thick??1),I=R.seed??aa([v,w]),L=hr(dt[R.kind]??"leaf",Fe(I^29095)),H=Fe(I^2317)();if((R.kind===ht.leaf||R.kind===ht.oak)&&H<cx.share&&(L=hr("accent",Fe(I^11325015))),bn&&fx.has(R.kind)){let J=Fe(I^24229),xe=J();xe<bn.turn?L=hr("autumn",J):xe<bn.turn+bn.brown?L=hr("dead",J):sl(L,"leaves")}let z=L.clone().offsetHSL(Ex*(D-ph),f?0:.1,xx*(ph-D)),F=jd(qd(v,w),S[b]);z.offsetHSL(F.hue,F.sat,F.light);let X=Wx(R.kind,I,bn?.name??"summer"),$=X?X.color:hr("bush",Fe(I^11601232),new ye,Fh),j=!X||X.on,Z=i?null:u[R.kind]?.[y],ge=Z?[Z.crown,Z.cards,Z.cardsHeart,Pe?Z.strands:null,R.kind===ht.chestnut||R.kind===ht.hawthorn?null:Z.blossom,Z.crown?null:Z.trunk]:[],Ee=Z?ge.map(J=>Bl(J)):[{r:.65,y:.9}],ze=!!Z&&!(Pt&&wr.has(R.kind)),$e={r:Math.max(0,...Ee.map(J=>J.r)),y:Math.max(0,...Ee.map(J=>J.y)),...ze?{hull:ge.flatMap(J=>J?[...Gh(J)]:[])}:{}},We=bc(R,$e),q=n(v,w)-.2;return p.push({x:v,z:w,kind:dt[R.kind],width:R.w??1,seed:I}),{kind:R.kind,shape:y,matrix:P,color:z,thick:D,blossom:$,flowers:j,seed:I,open:R.open??null,crown:{x:v,z:w,r:We.r,top:q+We.top},height:We.top}});if(!i&&Pt&&Mn.on[ft]&&jr){let E=Wu(Float32Array.from(M.flatMap(b=>[b.crown.x,b.crown.z,b.height,b.crown.r])),{facing:l});M.forEach((b,R)=>b.buried=E[R]===1)}c.userData.crowns=M.map(E=>E.crown),c.userData.kinds={};for(let E of M)c.userData.kinds[dt[E.kind]]=(c.userData.kinds[dt[E.kind]]??0)+1;let g={leafMat:vx(new xn({color:f?10135696:14476752,vertexColors:!0}),f),cardMats:{leaves:Th("leaf"),willow:Th("willow","strands"),blossom:Ch({map:Oh(),vertexColors:!0,alphaToCoverage:!0,alphaTest:Kl})}};for(let E of Object.values(g.cardMats))E.userData.seeThrough="leaves";return f&&(g.leafMat.userData.seeThrough="leaves"),i||jr?jx(c,M,u,g,r&&!i,i,a,s):oE(c,M,u,g,r),Pe&&!i&&(c.userData.feet=eh(p,n)),c}function tp(e,n,t){let r=[["trunk",n.trunk,e.matrix,new ye(pt[mn[t].bark]),"bark"]];if(n.cards){t!=="birch"&&!Gl(t)&&r.push(["crown",n.crown,e.matrix,e.color.clone().multiplyScalar(Hl(t)),"crown"]);let o=Vt(t,e.shape);r.push(["cards",n.cards,e.matrix,Fo(e.color,o),Qr(o)]),Pe&&n.strands&&r.push(["strands",n.strands,e.matrix,e.color.clone().lerp(new ye(1,1,.9),.4),"willow"]),n.blossom&&e.flowers!==!1&&r.push(["blossom",n.blossom,e.matrix,e.blossom,"blossom"])}else n.crown&&r.push(["crown",n.crown,e.matrix,e.color,"crown"]);return r}function jx(e,n,t,r,o,i=!1,a=null,s=null){let l=Xl(),c=new Map,f=n.map(h=>lp(h,t,l,i)),u=[...new Set(n.map(h=>h.kind))],d=h=>h==="bark"?nE():h==="crown"?r.leafMat:r.cardMats[h];for(let h of f)for(let _ of i?h.far:ql(h)){let T=c.get(_.key);T||c.set(_.key,T={key:_.key,material:d(_.key),geometries:new Map,parts:[]}),T.geometries.has(_.geometry)||T.geometries.set(_.geometry,-1),T.parts.push(_)}for(let h of c.values()){let _=Qx(u).get(h.key),T=!!_&&[...h.geometries.keys()].every(p=>_.ids.has(p)),m=T?new Ki(h.parts.length,_,h.material):np(h);if(T)for(let p of h.geometries.keys())h.geometries.set(p,_.ids.get(p));m.userData.role=(h.parts.find(p=>p.role!=="far")??h.parts[0]).role;for(let p of h.parts){let S=m.addInstance(h.geometries.get(p.geometry));m.setMatrixAt(S,p.matrix),m.setColorAt(S,p.color),m.setVisibleAt(S,i||zs(p.role,{boughs:!1},p)),p.mesh=m,p.id=S}m.sortObjects=h.key==="crown"&&!Pe,m.castShadow=o&&h.key!=="blossom",h.key==="blossom"&&(m.userData.blossom=!0),h.key==="bark"&&(m.userData.trunk=!0),e.add(m)}i||(e.userData.detail=new Il(e,n,f,a,s))}function np(e){let n=0,t=0;for(let o of e.geometries.keys())n+=o.attributes.position.count,t+=o.index?o.index.count:0;let r=new si(e.parts.length,n,Math.max(1,t),e.material);for(let o of e.geometries.keys())e.geometries.set(o,r.addGeometry(o));return r}var Un=null,No=new Set,bh=new Set,rp=new Set,op=!1,Oo=new Set,ip=dt.map((e,n)=>n);function s2(e){op=!0;for(let t of e)rp.add(t);if(!Un||!jr)return!1;let n=Ul(e);return Yi(),n}function Qx(e=ip){return Un?e.some(n=>!No.has(n))&&(Ul(e),Yi()):(Un=new Map,Ul([...rp,...e]),Yi()),Un}function Ul(e){let n=[...new Set(e)].filter(r=>dt[r]!=null&&!No.has(r));if(!n.length)return!1;ap(n);let t=Pt?[...new Set(n.filter(r=>wr.has(r)).map(Rn))].filter(r=>!bh.has(r)):[];for(let[r,o]of Jx(n,t)){let i=Un.get(r),a=[...o].filter(s=>!i?.ids.has(s));if(a.length)try{if(i)eE(i,a);else{let s={geometries:new Map(a.map(l=>[l,-1])),parts:[null]};Un.set(r,{store:np(s),ids:s.geometries})}}catch(s){console.warn(`Trees: the ${r} shapes kept in each batch (${s.message})`)}}for(let r of n)No.add(r);for(let r of t)bh.add(r);return!0}function Jx(e,n){let t=kl(),r=Xl(),o=new Map,i=(a,s)=>{o.has(a)||o.set(a,new Set),o.get(a).add(s)};for(let a of e)t[a].forEach((s,l)=>{for(let c of[!1,!0]){let f={kind:a,shape:l,matrix:new $t,color:new ye,thick:1,blossom:new ye,seed:1,buried:c};for(let u of ql(lp(f,t,r,!1)))i(u.key,u.geometry)}});for(let a of n)for(let s of[Pl(a),$i(a,"mid"),$i(a,"far")]){if(s.bark)for(let l of s.bark)i("bark",l);for(let[l,c]of Object.entries(s.leaves))for(let f of c)i(Qr(l),f)}return o}function eE(e,n){let t=e.store,r=0,o=0;for(let i of n)r+=i.attributes.position.count,o+=i.index?i.index.count:0;t.setGeometrySize(t._maxVertexCount+r,t._maxIndexCount+o);for(let i of n)e.ids.set(i,t.addGeometry(i))}function ap(e){let n=e.filter(i=>Oo.has(i));if(!n.length)return;let t=zh(),r=Qh(),o=(i,a)=>i.forEach((s,l)=>{for(let[c,f]of Object.entries(s)){let u=a[l]?.[c];if(!(!f||!u)){for(let[d,h]of Object.entries(u.attributes))f.setAttribute(d,h);u.index&&f.setIndex(u.index),f.userData.gone=!1,f.userData.idle=!1}}});for(let i of n)o(mr[i],t[i]),Zr&&o(Zr[i],r[i]),Oo.delete(i)}var sp=!1;function l2(){sp=!0,Yi()}function Yi(){if(!sp||!Un||!jr||!mr)return;for(let n of mr)for(let t of n)for(let r of[t.crown,t.cards,t.cardsHeart,t.strands,t.blossom,t.trunk])r&&(Bl(r),Pt||Gh(r));let e=n=>{for(let[t,r]of Object.entries(n.attributes))n.setAttribute(t,new Ge(new r.array.constructor(0),r.itemSize,r.normalized));n.index&&n.setIndex(new Ge(new n.index.array.constructor(0),1))};for(let{ids:n}of Un.values())for(let t of n.keys())t.userData.onShelf||(t.userData.onShelf=!0,e(t));for(let n of No)for(let t of[...mr[n],...Zr?.[n]??[]])for(let r of Object.values(t))!r||r.userData.onShelf||r.userData.idle||(r.userData.idle=!0,e(r));if(op){for(let n of ip)if(!(No.has(n)||Oo.has(n))){for(let t of[...mr[n],...Zr?.[n]??[]])for(let r of Object.values(t))!r||r.userData.onShelf||r.userData.gone||r.userData.idle||(r.userData.gone=!0,e(r));Oo.add(n)}}}function c2(){ap([...Oo]);for(let{store:e,ids:n}of Un?.values()??[]){let t=e.geometry;for(let[r,o]of n){if(!r.userData.onShelf)continue;let i=e.getGeometryRangeAt(o);for(let[a,s]of Object.entries(t.attributes))r.setAttribute(a,new Ge(s.array.slice(i.vertexStart*s.itemSize,(i.vertexStart+i.vertexCount)*s.itemSize),s.itemSize,s.normalized));t.index&&r.setIndex(new Ge(t.index.array.slice(i.indexStart,i.indexStart+i.indexCount).map(a=>a-i.vertexStart),1)),r.userData.onShelf=!1}}}var tE=["geometry","_geometryInfo","_geometryCount","_nextVertexStart","_nextIndexStart"],Ki=class extends si{constructor(n,t,r){let o=t.store;super(n,o._maxVertexCount,o._maxIndexCount,r),this.shelf=t,this._geometryInitialized=!0}dispose(){this.shelf=null,this._own.geometry=new xt,super.dispose()}};for(let e of tE)Object.defineProperty(Ki.prototype,e,{get(){return this.shelf?this.shelf.store[e]:this._own?.[e]},set(n){this._own||Object.defineProperty(this,"_own",{value:{},writable:!0}),this.shelf||(this._own[e]=n)}});function lp(e,n,t,r){let o=dt[e.kind],i=r?null:n[e.kind][e.shape],a=t[e.kind][e.shape],s=Pt&&e.seed!=null&&wr.has(e.kind),l=i?tp(e,i,o).map(([S,M,g,E,b])=>({role:S,geometry:M,matrix:g,color:E,key:b})):[],c=l.find(S=>S.role==="cards"),f=l.find(S=>S.role==="trunk"),u=l.find(S=>S.role==="crown"),d=s&&!!e.buried&&!!i;if(d){u&&Object.assign(u,{worn:!0,geometry:i.core??u.geometry}),c&&i.cardsHeart&&Object.assign(c,{worn:!0,geometry:i.cardsHeart});for(let S of l)S.role==="strands"&&(S.worn=!0);for(let[S,M,g,E,b]of xh(e,a,o).slice(1))l.push({role:S==="far"?b==="crown"?"crown":"cards":S,geometry:M,matrix:g,color:E,key:b,plain:!0})}else s?(u&&i.core&&(u.geometry=i.core),c&&i.cardsHeart&&(c.geometry=i.cardsHeart)):u&&i?.core&&(u.nearOnly=!0);let h=Vt(o,e.shape),_=s?Yh(e,o,{color:f?.color??new ye(pt[mn[o].bark]),key:"bark"},{color:c?.color??Fo(e.color,h),key:Qr(h)},!r&&!!i.limbs&&(c?!!i.cardsClose:!0)):null;i&&l.push(...(_?.near??[]).map(S=>d?{...S,worn:!0}:S));let T=!r&&i.limbs&&i.trunkNear&&f,m=!r&&i.limbs?[{...f,role:"limbs",geometry:i.limbs},...i.cardsClose&&c?[{...c,role:"cardsClose",geometry:i.cardsClose}]:[],...!s&&u&&i.core?[{...u,role:"core",geometry:i.core,nearOnly:!1}]:[],..._?.close??[]]:null;T&&Object.assign(f,{geometry:i.trunkNear,nearOnly:!0});let p=xh(e,s&&!d?{...a,crown:a.crownHeart??a.crown,cards:a.cardsHeart??a.cards}:a,o).map(([S,M,g,E,b])=>({role:S,geometry:M,matrix:g,color:E,key:b}));return a.cards&&!d&&p.push(..._?.far??[]),{near:l,close:m,far:p}}function ql(e){return e.close?[...e.near,...e.close,...e.far]:[...e.near,...e.far]}function nE(){return cp(new xn({color:16777215,vertexColors:!0}))}function cp(e){e.userData.seeThrough="trunk";let n=Vn(_x(e),"trunk");return Pe?nn(n,"bark",{tBark:bo().tBark}):n}var wh={leaf:"#87b261",pine:"#7dba6f",oak:"#87b261",birch:"#a4c878",poplar:"#7eaa58",bush:"#8fb868",willowleaf:"#9cb86a",willow:"#9cb86a",plane:"#87b261",chestnut:"#87b261",chestnutwhorl:"#87b261",holly:"#87b261",hawthorn:"#87b261",beech:"#87b261",spruce:"#7dba6f",scots:"#7dba6f",cedar:"#7dba6f"};var rE=new ye(1,1,.95),Oi={h:0,s:0,l:0};function Fo(e,n="leaf",t=new ye){let r=new ye(wh[n]??wh.leaf);e.clone().lerp(rE,.45).multiply(r).getHSL(Oi);let{s:i,l:a}=Oi;return e.getHSL(Oi),t.setHSL(Oi.h,i,a),t.setRGB(t.r/r.r,t.g/r.g,t.b/r.b)}function f2(){let e=kl(),n=Fe(684453),t=Fe(684454),r=Fe(684455),o=new ye(Pe?10135696:14476752),i=new $t;return dt.map((a,s)=>e[s].map((l,c)=>{let f=Vl(s,c,[n,t,r],684464),u=hr(a,f),d=Pe?u:u.clone().offsetHSL(0,.1,0),h=hr("bush",f,new ye,Fh);s===ht.chestnut&&jh(Fe(13258014+c*31+7),h);let _=[{role:"trunk",geometry:l.trunk,matrix:i,color:new ye(pt[mn[a].bark]),map:null}],T=Pt&&wr.has(s),m=Vt(a,c),p=T?Yh({kind:s,shape:c,matrix:i,seed:aa([s,c,176])},a,{color:_[0].color,key:"bark"},{color:Fo(d,m),key:Qr(m)},!1).near:[];return _.push(...p.filter(S=>S.role==="trunk").map(S=>({role:"trunk",geometry:S.geometry,matrix:S.matrix,color:S.color,map:null}))),l.cards?(a!=="birch"&&_.push({role:"crown",geometry:T&&l.core||l.crown,matrix:i,color:d.clone().multiplyScalar(Hl(a)).multiply(o),map:null}),_.push({role:"cards",geometry:T&&l.cardsHeart||l.cards,matrix:i,color:Fo(d,m),map:wl(m)}),_.push(...p.filter(S=>S.role==="cards").map(S=>({role:"cards",geometry:S.geometry,matrix:S.matrix,color:S.color,map:wl(m)}))),l.strands&&_.push({role:"strands",geometry:l.strands,matrix:i,color:d.clone().lerp(new ye(1,1,.9),.4),map:Ih("willow")}),l.blossom&&s!==ht.hawthorn&&_.push({role:"blossom",geometry:l.blossom,matrix:i,color:h,map:Oh()})):l.crown&&_.push({role:"crown",geometry:l.crown,matrix:i,color:d.clone().multiply(o),map:null}),_}))}function oE(e,n,t,r,o){let i=new Map,a=l=>{let c=mn[l].bark;return i.has(c)||i.set(c,cp(new xn({color:pt[c],vertexColors:!0}))),i.get(c)},s={crown:r.leafMat,...r.cardMats};for(let l=0;l<dt.length;l++){let c=dt[l];for(let f=0;f<t[l].length;f++)for(let u of[!0,!1]){let d=n.filter(T=>T.kind===l&&T.shape===f&&T.flowers!==!1===u);if(!d.length)continue;let h=t[l][f],_=d.map(T=>tp(T,h,c));_[0].forEach(([T,m,,,p],S)=>{let M=new us(m,T==="trunk"?a(c):s[p],d.length);M.userData.role=T,M.userData.kind=c,_.forEach((g,E)=>{let[,,b,R]=g[S];M.setMatrixAt(E,b),T!=="trunk"&&M.setColorAt(E,R)}),T==="trunk"&&(M.userData.trunk=!0),T==="blossom"&&(M.userData.blossom=!0),M.castShadow=o&&T!=="blossom",e.add(M)})}}}var Zl=new Set;function u2(e){$l.delete(e);let n=e.userData?.detail;n&&Zl.delete(n)}var Il=class{constructor(n,t,r,o=null,i=null){this.group=n,this.front=o,this.own=i,this.placed=t,this.trees=r,this.centres=new Float32Array(t.length*2),t.forEach((a,s)=>{this.centres[s*2]=a.crown.x,this.centres[s*2+1]=a.crown.z}),this.far=new Uint8Array(t.length),this.close=new Uint8Array(t.length),this.hasClose=r.some(a=>a.close),this.buried=Uint8Array.from(t,a=>a.buried?1:0),this.boughs=new Uint8Array(t.length),this.hasBuried=this.buried.some(a=>a),this.plan=null,this.decided=!1,Zl.add(this)}decide(n,t,r=!0,o=n,i=null){let a=this.own&&Zx()?this.own:null,s=new Set(Yu(this.centres,Ws(n,t),this.far,{distance:Jh()?1/0:Jr,never:a}));if(this.hasClose&&r)for(let c of zu(this.centres,o,this.close,{distance:Yl(),front:this.front,frontDistance:Kx(),max:qx(),always:a,ahead:i?{dir:i}:null}))s.add(c);if(this.hasBuried&&r)for(let c of Xu(this.centres,Ws(n,t),this.buried,this.boughs))s.add(c);let l=new Set;for(let c of s){let f=this.trees[c],u={far:this.far[c]===1,close:!!f.close&&this.close[c]===1,boughs:this.boughs[c]===1};for(let d of ql(f))d.mesh.setVisibleAt(d.id,zs(d.role,u,d)),l.add(d.mesh)}for(let c of l)c.userData.shadowVersion=(c.userData.shadowVersion??0)+1;return this.decided=!0,s.size}};function d2(e,n,{cut:t=!1,plan:r=null,stand:o=null}={}){let i=0,a=[n.position.x,n.position.z],s=n.quaternion,l=s?[-2*(s.x*s.z+s.w*s.y),-(1-2*(s.x*s.x+s.y*s.y))]:null,c=l&&Math.hypot(l[0],l[1])>.5?l:null;for(let f of Zl){let u=f.group;for(;u.parent;)u=u.parent;if(!u.isScene||u!==e)continue;let d=r!==f.plan;f.plan=r;let h=Ku(f.centres,f.far,a[0],a[1],{distance:Jr});qu({cut:t||!f.decided,newPlan:d,tooClose:h})&&(i+=f.decide(a,r,t||!f.decided||d,o??a,c))}return i}var ea={factor:1.5,maxPixels:3840*2160,least:1.1},jl={full:4,light:2,superAt:1.4};function _2({supersample:e=1,taa:n=!1}={}){return n&&e>=jl.superAt?jl.light:jl.full}function iE({width:e,height:n,ratio:t=1}={}){let r=Number(e),o=Number(n),i=Number.isFinite(t)&&t>0?t:1;if(!(r>0&&o>0))return 1;let a=r*o*i*i,s=Math.sqrt(ea.maxPixels/a),l=Math.min(ea.factor,s);return l>=ea.least?Math.floor(l*100)/100:1}function v2({width:e,height:n,ratio:t=1,rec:r=null}={}){let o=iE({width:e,height:n,ratio:t}),i=Number.isFinite(t)&&t>0?t:1,a=Number(e)*i,s=Number(n)*i;if(!(r?.width>0&&r?.height>0)||!(a>0&&s>0))return 1;let l=Math.min(r.width/a,r.height/s),c=Math.min(o,l);return c>=ea.least?Math.floor(c*100)/100:1}var aE={factor:1,hold:.3};function S2(e,{moving:n=!1,recording:t=!1,dt:r=0}={}){return t?(e.eased=!1,e.left=0):n?(e.eased=!0,e.left=aE.hold):e.eased&&(e.left-=Number.isFinite(r)?r:0,e.left<=0&&(e.eased=!1)),e.eased}function x2(e,n=1,t=1){let r=Number.isFinite(e)&&e>0?e:1,o=Number.isFinite(n)&&n>0?Math.min(n,1):1,i=Number.isFinite(t)&&t>=1?t:1;return Math.round(r*o*i*1e3)/1e3}var Ql={most:2,join:.3,scale:.5,keep:{move:3,turn:.06}};function E2(e,n,t=Ql.keep){return e<t.move&&n<t.turn}function M2(e,{most:n=Ql.most,join:t=Ql.join}={}){let r=[],o=e.map((i,a)=>({...i,i:a})).filter(i=>Number.isFinite(i.level)).sort((i,a)=>(i.near??1/0)-(a.near??1/0));for(let i of o){let a=r.find(s=>Math.abs(s.level-i.level)<=t);a?a.members.push(i.i):r.length<n&&r.push({level:i.level,members:[i.i]})}return r}var Bo={near:.45,nearSoft:.3,far:6,reach:160,farSoft:2,amount:.55};function T2(e){if(!(e>0))return null;let n=Math.max(e*Bo.far,Bo.reach);return{near:[e*Bo.near,e*Bo.nearSoft],far:[n,n*Bo.farSoft]}}var sE={strength:.08,decay:.95,samples:40,reach:.35,fade:.6,floor:1.2,cap:6};function b2({x:e,y:n,ahead:t}){if(!t||!Number.isFinite(e)||!Number.isFinite(n))return 0;let r=Math.max(Math.abs(e),Math.abs(n))-1;if(r<=0)return 1;let o=Math.min(1,r/sE.fade);return 1-o*o*(3-2*o)}var lE={frames:8,blend:.9};function fp(e,n){let t=1,r=0;for(let o=e+1;o>0;o=Math.floor(o/n))t/=n,r+=t*(o%n);return r}function w2(e,{still:n=!1,upscale:t=!1}={}){if(n&&!t)return[0,0];let r=t?up.frames:lE.frames,o=(e%r+r)%r;return[fp(o,2)-.5,fp(o,3)-.5]}var up={share:.67,frames:16,sharp:2.2,least:.04,most:.3};function A2(e,n,t=!0){let r=t?up.share:1;return[Math.max(1,Math.round(e*r)),Math.max(1,Math.round(n*r))]}var vr={most:4,life:5,speed:.8,rings:3,gap:.55};function R2(e,n){let t=e.filter(o=>n.time-o.time<vr.life),r=Math.min(1,Math.max(0,Number(n.size)||0));return[...t,{...n,size:r}].slice(-vr.most)}function y2(e){let n=Number.isFinite(e)?e:0;return Math.min(1,.3+n/40)}var ta=6200,ko=[0,-300],cE=.25,dp=40,U2={high:{clouds:24,puffs:8},standard:{clouds:12,puffs:5}},Go={billow:.24,soft:.5,shrink:.3,round:.55},Jl=new Set;function fE(e,n,t=1){let r=Yf(t*104729+3),o=[],i=[];for(let a=0;a<e;a++){let l=r()<.6?-Math.PI/2+(r()-.5)*2.2:a/e*Math.PI*2+r()*.3,c=2400+r()*2900,f=a%3===2,u=f?1150+r()*350:560+r()*320,d=f?260+r()*260:380+r()*420;o.push({x:Math.cos(l)*c+ko[0],y:u,z:Math.sin(l)*c+ko[1],rank:(a+r()*.8)/e,width:d});for(let h=0;h<n;h++){let _=n===1?0:(h/(n-1)-.5)*2*(.75+r()*.2),T=1-_*_,m=h%2===0,p=d*(.17+.13*T+r()*.06)*(m?.95:.8),S=m?p*.35:p*(.55+T*.7)*(f?.6:1);i.push({cloud:a,x:_*d*.5,y:S,z:(r()-.5)*d*.35,r:p,shade:Math.min(1,S/(d*.42))})}}return{clouds:o,puffs:i}}var hp=e=>Math.min(1,1.7*Math.max(0,Number.isFinite(e)?e:0)),uE=`
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
`,dE=`
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
    float edge = ${(1-Go.billow).toFixed(2)} + ${Go.billow.toFixed(2)} * (0.65 * cNoise(q * 2.6 + vSeed * 40.0) + 0.35 * cNoise(q * 6.1 + vSeed * 73.0));
    float body = 1.0 - r / edge;
    // Thinning out to its edge over CLOUD_LOOK.soft of the way in; and as
    // it fades (out far off, or in and out with the day's cover) thinner as
    // a whole and shrunk a little from its edge (CLOUD_LOOK.shrink). With
    // hard-rimmed puffs a cloud half faded was a ghost of rings, each puff's
    // outline over the next; shrunk away alone, it broke into separate
    // little balls.
    float gone = (1.0 - vAlpha) * ${Go.shrink.toFixed(2)};
    float a = smoothstep(gone, gone + ${Go.soft.toFixed(2)}, body) * vAlpha * uOpacity;
    if (a <= 0.003) discard;
    // Lit on the side towards the sun and on top, over the cloud's own
    // shading from base to top - each puff's own roundness held back
    // (CLOUD_LOOK.round), so a cloud is lit as one, not as a heap of balls.
    vec3 n = vec3(q, sqrt(max(0.0, 1.0 - r * r)));
    float towards = dot(n, normalize(vec3(vSun * 0.7, 0.6))) * 0.5 + 0.5;
    float lit = clamp(vShade * 0.55 + (n.y * 0.25 + towards * 0.45 - 0.35) * ${Go.round.toFixed(2)} + 0.3, 0.0, 1.0);
    gl_FragColor = vec4(mix(uBase, uTop, lit), a);
    #include <colorspace_fragment>
  }
`;function I2({clouds:e=24,puffs:n=8,sun:t=new ne(0,1,0),seed:r=1}={}){let o=new Ct(1,1),i=new Ss;i.index=o.index,i.setAttribute("position",o.getAttribute("position"));let a=e*n,s=new Ur(new Float32Array(a*3),3),l=new Ur(new Float32Array(a*4),4),c=new Ur(new Float32Array(a*2),2);for(let d of[s,l,c])d.setUsage(is);i.setAttribute("aCloud",s),i.setAttribute("aPuff",l),i.setAttribute("aLook",c),i.instanceCount=a;let f=new Qt({name:"Clouds",vertexShader:uE,fragmentShader:dE,uniforms:{uDrift:{value:new je},uMiddle:{value:new je(...ko)},uWrap:{value:ta},uShowing:{value:hp(.35)},uSize:{value:1},uReach:{value:1},uSun:{value:t.clone().normalize()},uTop:{value:new ye(pt.cloud)},uBase:{value:new ye(pt.cloudShade)},uOpacity:{value:.95}},transparent:!0,depthWrite:!1,fog:!1,toneMapped:!1});nn(f,"clouds",{uniforms:f.uniforms});let u=new Rt(i,f);return u.name="clouds",u.frustumCulled=!1,u.userData.clouds={count:e,perCloud:n,sortedAt:-1/0,at:new ne(1/0,0,0),sorts:0},hE(u,r),u.onBeforeRender=(d,h,_)=>pE(u,_),Jl.add(u),u}function hE(e,n=1){let t=e.userData.clouds;t.layout=fE(t.count,t.perCloud,n),t.seed=n,t.sortedAt=-1/0}function N2(e,n){let t=e.material.uniforms;t.uShowing.value=hp(n.cover),t.uSize.value=1+.55*Math.max(0,n.cover-.35),t.uOpacity.value=.9+.08*n.cover,t.uBase.value.set(pt.cloudShade).lerp(new ye(pt.cloudSlate),n.grey*.8)}function pE(e,n){let t=e.userData.clouds,r=performance.now()/1e3,o=n.getWorldPosition(mE);if(r-t.sortedAt<cE&&o.distanceToSquared(t.at)<dp*dp)return;t.sortedAt=r,t.at.copy(o),t.sorts++;let i=e.material.uniforms,a=i.uSize.value,[s,l]=[i.uDrift.value.x,i.uDrift.value.y],c=ta,f=(M,g)=>((M-g+c)%(2*c)+2*c)%(2*c)-c+g,{clouds:u,puffs:d}=t.layout,h=u.map(M=>[f(M.x+s,ko[0]),M.y,f(M.z+l,ko[1])]),_=d.map((M,g)=>{let E=h[M.cloud],b=E[0]+M.x*a-o.x,R=E[1]+M.y*a-o.y,v=E[2]+M.z*a-o.z;return[b*b+R*R+v*v,g]});_.sort((M,g)=>g[0]-M[0]);let T=e.geometry,m=T.getAttribute("aCloud").array,p=T.getAttribute("aPuff").array,S=T.getAttribute("aLook").array;_.forEach(([,M],g)=>{let E=d[M],b=u[E.cloud];m.set([b.x,b.y,b.z],g*3),p.set([E.x,E.y,E.z,E.r],g*4),S.set([E.shade,b.rank],g*2)});for(let M of["aCloud","aPuff","aLook"])T.getAttribute(M).needsUpdate=!0}var mE=new ne,O2=e=>1/(1+.6*Math.max(0,e-1));function F2(e,[n,t]){for(let r of Jl){if(!r.parent){Jl.delete(r);continue}let o=r.material.uniforms.uDrift.value;o.x=(o.x+n*e)%(2*ta),o.y=(o.y+t*e)%(2*ta)}}var pp={base:700,top:1350,steps:32,light:3,reach:9e3,fade:.45,noise:32,cells:4,big:700,small:190};function B2(e){let n=Math.min(1,Math.max(0,Number.isFinite(e)?e:.35));return n<.35?.97-(.97-.625)*(n/.35):Math.max(.25,.8-.5*n)}function G2(e=pp.noise,n=pp.cells,t=7){let r=t,o=()=>(r=r*16807%2147483647)/2147483647,i=u=>{let d=Float32Array.from({length:u*u*u},o);return(_,T,m)=>d[(m%u+u)%u*u*u+(T%u+u)%u*u+(_%u+u)%u]},a=i(n),s=i(n*2),l=u=>u*u*(3-2*u),c=(u,d,h,_,T)=>{let m=h/e*d,p=_/e*d,S=T/e*d,M=Math.floor(m),g=Math.floor(p),E=Math.floor(S),b=l(m-M),R=l(p-g),v=l(S-E),w=(P,D,I)=>P+(D-P)*I,y=P=>w(w(u(M,g,P),u(M+1,g,P),b),w(u(M,g+1,P),u(M+1,g+1,P),b),R);return w(y(E),y(E+1),v)},f=new Uint8Array(e*e*e);for(let u=0;u<e;u++)for(let d=0;d<e;d++)for(let h=0;h<e;h++){let _=.65*c(a,n,h,d,u)+.35*c(s,n*2,h,d,u);f[u*e*e+d*e+h]=Math.round(_*255)}return f}function mp(e,n,t){let r=!1;for(let o=0,i=e.length-1;o<e.length;i=o++){let[a,s]=e[o],[l,c]=e[i];s>t!=c>t&&n<(l-a)*(t-s)/(c-s)+a&&(r=!r)}return r}var _p=2e3;function*V2(e,{cell:n=.25,pad:t=1.5,maxCells:r=160,heightAt:o=null}={},i=_p){let a=1/0,s=1/0,l=-1/0,c=-1/0;for(let[M,g]of e)a=Math.min(a,M),s=Math.min(s,g),l=Math.max(l,M),c=Math.max(c,g);a-=t,s-=t,l+=t,c+=t,n=Math.max(n,(l-a)/(r-1),(c-s)/(r-1));let f=Math.ceil((l-a)/n)+1,u=Math.ceil((c-s)/n)+1,d=new Float32Array(f*u),h=o?new Float32Array(f*u):null,_=e.length,T=Float64Array.from(e,M=>M[0]),m=Float64Array.from(e,M=>M[1]),p=o?Float64Array.from(e,M=>o(M[0],M[1])):null,S=0;for(let M=0;M<u;M++){M&&(S+=f)>=i&&(S=0,yield);let g=s+M*n;for(let E=0;E<f;E++){let b=a+E*n,R=1/0,v=!1,w=0,y=0;for(let D=0,I=_-1;D<_;I=D++){let L=T[I],H=m[I],z=T[D]-L,F=m[D]-H,X=z*z+F*F,$=X>0?((b-L)*z+(g-H)*F)/X:0;$=$<0?0:$>1?1:$;let j=L+z*$-b,Z=H+F*$-g,ge=j*j+Z*Z;if(ge<R&&(R=ge),p){let Ee=Math.sqrt(X)/((ge+.25)*(ge+.25));w+=Ee*(p[I]+(p[D]-p[I])*$),y+=Ee}m[D]>g!=H>g&&b<z*(g-m[D])/F+T[D]&&(v=!v)}R=Math.sqrt(R);let P=M*f+E;d[P]=v?R:-R,h&&(h[P]=v&&y>0?Math.max(0,w/y-o(b,g)):0)}}return{x0:a,z0:s,cell:n,nx:f,nz:u,width:(f-1)*n,height:(u-1)*n,dist:d,depth:h}}function gE(e,n,t=4){let{x0:r,z0:o,cell:i,nx:a,nz:s}=e,l=r+(a-1)*i,c=o+(s-1)*i,f=n.filter(d=>{let h=d.map(T=>T[0]),_=d.map(T=>T[1]);return Math.min(...h)<l+t&&Math.max(...h)>r-t&&Math.min(..._)<c+t&&Math.max(..._)>o-t});if(!f.length)return null;let u=new Float32Array(a*s).fill(1/0);for(let d of f){let h=d.length;for(let _=0;_<s;_++){let T=o+_*i;for(let m=0;m<a;m++){let p=r+m*i,S=1/0,M=!1;for(let b=0,R=h-1;b<h;R=b++){let[v,w]=d[R],y=d[b][0]-v,P=d[b][1]-w,D=y*y+P*P,I=D>0?((p-v)*y+(T-w)*P)/D:0;I=I<0?0:I>1?1:I;let L=v+y*I-p,H=w+P*I-T;S=Math.min(S,L*L+H*H),d[b][1]>T!=w>T&&p<y*(T-d[b][1])/P+d[b][0]&&(M=!M)}let g=M?-Math.sqrt(S):Math.sqrt(S),E=_*a+m;g<u[E]&&(u[E]=g)}}}return u}function*z2(e,{cell:n=.25,pad:t=1.5,maxCells:r=160,heightAt:o=null}={},i=_p){let a=1/0,s=1/0,l=-1/0,c=-1/0;for(let m of e)for(let[p,S]of m)a=Math.min(a,p),s=Math.min(s,S),l=Math.max(l,p),c=Math.max(c,S);a-=t,s-=t,l+=t,c+=t,n=Math.max(n,(l-a)/(r-1),(c-s)/(r-1));let f=Math.ceil((l-a)/n)+1,u=Math.ceil((c-s)/n)+1,d=[];e.forEach((m,p)=>{for(let S=0,M=m.length-1;S<m.length;M=S++){let g=(m[S][0]+m[M][0])/2,E=(m[S][1]+m[M][1])/2;e.some((b,R)=>R!==p&&mp(b,g,E))||d.push([m[M][0],m[M][1],m[S][0],m[S][1],o?o(m[M][0],m[M][1]):0,o?o(m[S][0],m[S][1]):0])}});let h=new Float32Array(f*u),_=o?new Float32Array(f*u):null,T=0;for(let m=0;m<u;m++){m&&(T+=f)>=i&&(T=0,yield);let p=s+m*n;for(let S=0;S<f;S++){let M=a+S*n,g=1/0,E=0,b=0;for(let[w,y,P,D,I,L]of d){let H=P-w,z=D-y,F=H*H+z*z,X=F>0?((M-w)*H+(p-y)*z)/F:0;X=X<0?0:X>1?1:X;let $=w+H*X-M,j=y+z*X-p,Z=$*$+j*j;if(Z<g&&(g=Z),_){let ge=Math.sqrt(F)/((Z+.25)*(Z+.25));E+=ge*(I+(L-I)*X),b+=ge}}let R=e.some(w=>mp(w,M,p));g=Math.sqrt(g);let v=m*f+S;h[v]=R?g:-g,_&&(_[v]=R&&b>0?Math.max(0,E/b-o(M,p)):0)}}return{x0:a,z0:s,cell:n,nx:f,nz:u,width:(f-1)*n,height:(u-1)*n,dist:h,depth:_}}function W2(e,n){let t=n?.length?gE(e,n,0):null;if(!t)return e;let{dist:r}=e;for(let o=0;o<r.length;o++)t[o]<0&&-t[o]>r[o]&&(r[o]=-t[o]);return e}function X2(e,n){let{x0:t,z0:r,cell:o,nx:i,nz:a}=e,s=new Float32Array(i*a);for(let l=0;l<a;l++){let c=r+l*o;for(let f=0;f<i;f++){let u=t+f*o,d=1/0;for(let h=1;h<n.length;h++){let[_,T]=n[h-1],m=n[h][0]-_,p=n[h][1]-T,S=m*m+p*p,M=S>0?((u-_)*m+(c-T)*p)/S:0;M=M<0?0:M>1?1:M;let g=_+m*M-u,E=T+p*M-c;d=Math.min(d,g*g+E*E)}s[l*i+f]=Math.sqrt(d)}}return s}function $2(e,n){let{x0:t,z0:r,cell:o,nx:i,nz:a,dist:s}=e,l=new Float32Array(i*a),c=!1;for(let f=0;f<a;f++)for(let u=0;u<i;u++){let d=f*i+u;l[d]=n(t+u*o,r+f*o),l[d]<0&&s[d]>0&&(c=!0)}if(!c)return null;for(let f=0;f<s.length;f++)s[f]=Math.min(s[f],l[f]);return l}var ec=[-2,4],_E=4,gp=4;function Y2(e,n=[-2,6],t=2,r=null,o=null,i=null){let{dist:a,depth:s}=e,l=new Uint8Array(a.length*4),c=n[1]-n[0],f=ec[1]-ec[0];for(let u=0;u<a.length;u++)l[u*4]=Math.round(255*Math.max(0,Math.min(1,(a[u]-n[0])/c))),i?l[u*4+1]=Math.round(255*Math.max(0,Math.min(1,(i[u]+gp)/(2*gp)))):l[u*4+1]=s?Math.round(255*Math.max(0,Math.min(1,s[u]/t))):0,l[u*4+2]=r?Math.round(255*Math.max(0,Math.min(1,(r[u]-ec[0])/f))):255,l[u*4+3]=o?Math.round(255*Math.max(0,Math.min(1,o[u]/_E))):255;return l}var vE=256;function SE(e=vE){let n=new Uint8ClampedArray(e*e*4),t=_c(17),r=[];for(;r.length<18;){let i=Math.round((t()-.5)*36),a=Math.round((t()-.5)*36),s=Math.hypot(i,a);s<3||r.push({kx:i,ky:a,phase:t()*6.28,amp:(4+t()*4)/s})}let o=(i,a)=>r.reduce((s,l)=>s+l.amp*Math.sin((l.kx*i+l.ky*a)/e*6.2832+l.phase),0);for(let i=0;i<e;i++)for(let a=0;a<e;a++){let s=o(a+1,i)-o(a-1,i),l=o(a,i+1)-o(a,i-1),c=Math.hypot(s*.4,l*.4,1),f=(i*e+a)*4;n[f]=-s*.4/c*127+128,n[f+1]=-l*.4/c*127+128,n[f+2]=1/c*127+128,n[f+3]=255}return n}var eo=null;function vp(){if(eo!=null)return eo;let e=SE();eo=0;for(let n=0;n<e.length;n+=4)eo=Math.max(eo,Math.hypot(e[n]/255*2-1,e[n+1]/255*2-1));return eo}function xE(e,n,t){let r=n.y-t;if(!(r>0))return null;let o=1/0,i=1/0,a=-1/0,s=-1/0;for(let l=0;l<8;l++){let c=l&1?e.max.x:e.min.x,f=l&2?e.max.y:e.min.y,u=l&4?e.max.z:e.min.z,d=r/(r+Math.max(0,f-t)),h=n.x+(c-n.x)*d,_=n.z+(u-n.z)*d;h<o&&(o=h),h>a&&(a=h),_<i&&(i=_),_>s&&(s=_)}return{x0:o,z0:i,x1:a,z1:s}}var EE=(e,n)=>e.x0<=n.x1&&n.x0<=e.x1&&e.z0<=n.z1&&n.z0<=e.z1;function J2(e,n,t,r){if(!e||!Number.isFinite(e.min?.x)||!Number.isFinite(e.max?.x))return!0;let o=xE(e,n,t);return!!o&&r.some(i=>EE(o,i))}function e3(e,n,t,r){let o=n.y-t;if(!(o>0))return null;let i=(o+Math.max(0,r-t))/o,a=e.x0,s=e.z0,l=e.x1,c=e.z1;for(let f of[e.x0,e.x1])for(let u of[e.z0,e.z1]){let d=n.x+(f-n.x)*i,h=n.z+(u-n.z)*i;a=Math.min(a,d),l=Math.max(l,d),s=Math.min(s,h),c=Math.max(c,h)}return{x0:a,z0:s,x1:l,z1:c}}var ME=64;function t3(e,n,t=ME){let r=Math.floor((e?e.length:n.length/3)/3),o=e?l=>e[l]:l=>l,i=Math.ceil(r/t),a=new Float32Array(i).fill(-1/0),s=new Float32Array(i).fill(1/0);for(let l=0;l<r;l++){let c=Math.floor(l/t);for(let f=0;f<3;f++){let u=n[o(l*3+f)*3+2];u>a[c]&&(a[c]=u),u<s[c]&&(s[c]=u)}}for(let l=1;l<i;l++)a[l]=Math.max(a[l],a[l-1]);for(let l=i-2;l>=0;l--)s[l]=Math.min(s[l],s[l+1]);return{count:r,block:t,top:a,bottom:s}}function n3(e,n,t){let{count:r,block:o,top:i,bottom:a}=e,s=i.length,l=0,c=s;for(;l<c;){let u=l+c>>1;i[u]<n?l=u+1:c=u}let f=l;for(l=0,c=s;l<c;){let u=l+c>>1;a[u]<=t?l=u+1:c=u}return[f*o,Math.min(r,l*o)]}var Sr={coarse:.11,fine:.06,gust:1.3,rain:.5,splash:.55,ringFade:.25,mirror:.06},r3=Object.freeze({near:3,reach:40,calm:.9,wind:6}),o3=Object.freeze({tint:.35,clear:.15,poolFrom:.55,poolTo:.8,scale:2,stretch:.5,speed:.35}),TE=1/Math.sqrt(2*Math.E);function i3({chop:e=1,gust:n=0,rain:t=0,splashes:r=[],now:o=0}={},i=vp()){let a=(Sr.coarse+Sr.fine)*i*Math.max(0,e)*(1+Sr.gust*Math.max(0,n));t>0&&(a+=Sr.rain);for(let s of r){let l=o-s.time;if(!(s.size>0)||l<0||l>=vr.life)continue;let c=(1-l/vr.life)**2*s.size,f=0;for(let u=0;u<vr.rings&&l-u*vr.gap>=0;u++)f+=1-u*Sr.ringFade;a+=Sr.splash*TE*c*f}return Sr.mirror*2*Math.sin(Math.atan(a)/2)}export{Ce as a,hi as b,xu as c,Ve as d,ml as e,fR as f,tn as g,It as h,Kw as i,Br as j,qw as k,Zw as l,Uu as m,jw as n,Pv as o,Qw as p,Jw as q,e1 as r,t1 as s,n1 as t,c1 as u,f1 as v,ft as w,Pe as x,Pt as y,wt as z,Nt as A,Dv as B,u1 as C,d1 as D,qd as E,Nv as F,Xs as G,un as H,$v as I,U1 as J,I1 as K,N1 as L,O1 as M,Js as N,F1 as O,Gr as P,$s as Q,g1 as R,_1 as S,qs as T,v1 as U,S1 as V,x1 as W,Ju as X,Cn as Y,Vv as Z,E1 as _,js as $,Xv as aa,xi as ba,R1 as ca,y1 as da,cd as ea,jv as fa,el as ga,V1 as ha,z1 as ia,pd as ja,eS as ka,tS as la,nS as ma,Ti as na,uA as oa,nn as pa,Vn as qa,bo as ra,Z1 as sa,j1 as ta,TA as ua,bA as va,ll as wa,wd as xa,zr as ya,aS as za,rA as Aa,oA as Ba,Rd as Ca,yd as Da,cS as Ea,Cd as Fa,Pd as Ga,iA as Ha,aA as Ia,Vd as Ja,CA as Ka,zd as La,LA as Ma,$d as Na,Lt as Oa,pl as Pa,SS as Qa,tR as Ra,nR as Sa,xS as Ta,rR as Ua,oR as Va,iR as Wa,Yd as Xa,wi as Ya,aR as Za,sR as _a,ER as $a,oh as ab,MR as bb,TR as cb,ah as db,bR as eb,Fe as fb,Rh as gb,Ch as hb,qS as ib,JR as jb,Fi as kb,e2 as lb,t2 as mb,n2 as nb,r2 as ob,o2 as pb,i2 as qb,Kl as rb,a2 as sb,s2 as tb,l2 as ub,c2 as vb,f2 as wb,u2 as xb,d2 as yb,_2 as zb,iE as Ab,v2 as Bb,aE as Cb,S2 as Db,x2 as Eb,Ql as Fb,E2 as Gb,M2 as Hb,Bo as Ib,T2 as Jb,sE as Kb,b2 as Lb,lE as Mb,w2 as Nb,up as Ob,A2 as Pb,vr as Qb,R2 as Rb,y2 as Sb,U2 as Tb,Go as Ub,I2 as Vb,hE as Wb,N2 as Xb,O2 as Yb,F2 as Zb,xv as _b,Ev as $b,Mv as ac,Tv as bc,kw as cc,Vw as dc,zw as ec,Ww as fc,Xw as gc,$w as hc,Cu as ic,pp as jc,B2 as kc,G2 as lc,mp as mc,V2 as nc,gE as oc,z2 as pc,W2 as qc,X2 as rc,$2 as sc,ec as tc,_E as uc,gp as vc,Y2 as wc,vE as xc,SE as yc,J2 as zc,e3 as Ac,ME as Bc,t3 as Cc,n3 as Dc,Sr as Ec,r3 as Fc,o3 as Gc,i3 as Hc};
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
