import{B as go,c as Gt,d as ao,k as pt,l as ou,y as Rs}from"./game.chunk-DPXQBJ5U.js";import{E as ys,b as iu,c as au,w as _o}from"./game.chunk-EPNVLM63.js";import{A as rr,C as ws,H as nu,ca as As,da as ru,va as su,y as eu,z as tu}from"./game.chunk-SAHULCRY.js";import{a as io,b as Nc,c as Oc,e as ua}from"./game.chunk-D65CLSHU.js";import{Aa as xc,Ad as Ic,Ba as la,Ca as Rn,Da as Tr,Ea as Ec,Fa as Mc,Ga as br,Ha as wr,Ia as ro,Ja as dt,Ka as ht,Ma as Tc,Na as bc,Oa as wc,Ud as Yo,ac as Ac,fd as jn,gd as oo,hd as Ar,id as yn,jd as Qn,kd as Rc,ld as $o,md as yc,nd as ca,od as Cc,pd as Pc,qd as Lc,sd as fa,td as Ko,ud as Dc,z as no,zd as Uc}from"./game.chunk-73HNAIIT.js";import{$ as _a,$a as ni,$b as Af,A as $c,Ab as es,Ac as Cf,B as Kc,Ba as $t,Bb as ts,Bc as ai,Bd as Yt,C as Yc,Ca as xf,Cb as ns,Cc as Pf,Cg as Qf,D as qc,Da as Ef,Db as rs,Dc as Lf,Dd as Vf,De as _s,Df as En,Dg as Jf,E as Zc,Ea as uo,Eb as os,Ec as si,Ee as ho,Ef as Zf,F as jc,Fa as ba,Fb as ii,Fc as Df,Fd as hs,Ff as jf,G as Qc,Ga as Bn,Gb as is,Gd as li,Ge as po,H as Jc,Ha as Cn,Hc as cs,Hd as ye,He as Kf,I as ef,Ia as xn,Ie as vs,J as tf,Ja as wa,Jd as ps,Je as fi,K as nf,Ka as Aa,L as rf,La as Lr,M as of,Ma as Mf,N as af,Na as Tf,O as sf,Oa as bf,Od as Oe,P as lf,Pa as wf,Q as cf,Qa as Qt,Qc as fs,R as ff,Ra as er,Rc as us,S as ga,Sa as tr,T as uf,Ta as Jo,Td as zf,U as df,Ua as Ra,V as hf,Va as nr,Vd as Wf,W as pf,Wa as ya,X as mf,Xd as qt,Y as gf,Ya as Ca,Z as _f,Za as ei,Zc as Uf,Zd as xt,_ as cn,_a as ti,_b as as,_c as If,a as Fc,aa as va,ab as ri,ac as un,ae as Xf,ba as Sa,bb as Pa,bc as Dr,bd as ds,ca as xa,cb as La,cc as ss,cd as qe,d as Hc,da as Ea,db as Da,dc as ls,dd as it,e as da,ea as Ma,eb as Ua,ec as tt,ed as Nf,f as Bc,fa as Ta,fb as Ia,ff as ui,fg as Es,gb as Na,gd as Of,ge as $f,gf as Ss,hb as Oa,hd as Ff,he as yt,i as so,ib as Fa,id as Hf,if as Lt,j as Gc,ja as Pr,jb as Ha,jd as Bf,k as Rr,ka as Jn,kb as oi,ke as Gn,kg as mo,l as yr,la as qo,lb as Ba,ld as je,m as kt,ma as Zo,mb as Ga,md as Kt,me as Ir,n as jt,na as co,nb as ka,nd as te,ne as ms,ng as Ms,nh as bs,o as Sn,oa as fn,ob as Va,od as Be,oe as gs,p as lo,pa as jo,pb as za,pd as ct,q as ha,qa as vf,qb as Wa,qe as ci,r as pa,ra as Hn,rb as Xa,s as ma,sa as Sf,sb as $a,sf as di,t as kc,tb as Ka,td as Gf,tf as Ht,ua as fo,ub as Ya,ud as Pt,uf as xs,v as Cr,vb as qa,vf as Yf,vg as Ts,w as Vc,wa as St,wb as Za,wd as Jt,wf as en,x as zc,xa as Qo,xb as ja,xd as Ur,xf as qf,y as Wc,yb as Qa,yc as Rf,z as Xc,za as Xt,zb as Ja,zc as yf,zd as kf}from"./game.chunk-X5TZQDMQ.js";function Pu(){let e=null,n=!1,t=null,r=null;function o(i,a){r=e.requestAnimationFrame(o),t(i,a)}return{start:function(){n!==!0&&t!==null&&e!==null&&(r=e.requestAnimationFrame(o),n=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),n=!1},setAnimationLoop:function(i){t=i},setContext:function(i){e=i}}}function Zp(e){let n=new WeakMap;function t(s,l){let f=s.array,c=s.usage,u=f.byteLength,d=e.createBuffer();e.bindBuffer(l,d),e.bufferData(l,f,c),s.onUploadCallback();let h;if(f instanceof Float32Array)h=e.FLOAT;else if(typeof Float16Array<"u"&&f instanceof Float16Array)h=e.HALF_FLOAT;else if(f instanceof Uint16Array)s.isFloat16BufferAttribute?h=e.HALF_FLOAT:h=e.UNSIGNED_SHORT;else if(f instanceof Int16Array)h=e.SHORT;else if(f instanceof Uint32Array)h=e.UNSIGNED_INT;else if(f instanceof Int32Array)h=e.INT;else if(f instanceof Int8Array)h=e.BYTE;else if(f instanceof Uint8Array)h=e.UNSIGNED_BYTE;else if(f instanceof Uint8ClampedArray)h=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+f);return{buffer:d,type:h,bytesPerElement:f.BYTES_PER_ELEMENT,version:s.version,size:u}}function r(s,l,f){let c=l.array,u=l.updateRanges;if(e.bindBuffer(f,s),u.length===0)e.bufferSubData(f,0,c);else{u.sort((h,_)=>h.start-_.start);let d=0;for(let h=1;h<u.length;h++){let _=u[d],T=u[h];T.start<=_.start+_.count+1?_.count=Math.max(_.count,T.start+T.count-_.start):(++d,u[d]=T)}u.length=d+1;for(let h=0,_=u.length;h<_;h++){let T=u[h];e.bufferSubData(f,T.start*c.BYTES_PER_ELEMENT,c,T.start,T.count)}l.clearUpdateRanges()}l.onUploadCallback()}function o(s){return s.isInterleavedBufferAttribute&&(s=s.data),n.get(s)}function i(s){s.isInterleavedBufferAttribute&&(s=s.data);let l=n.get(s);l&&(e.deleteBuffer(l.buffer),n.delete(s))}function a(s,l){if(s.isInterleavedBufferAttribute&&(s=s.data),s.isGLBufferAttribute){let c=n.get(s);(!c||c.version<s.version)&&n.set(s,{buffer:s.buffer,type:s.type,bytesPerElement:s.elementSize,version:s.version});return}let f=n.get(s);if(f===void 0)n.set(s,t(s,l));else if(f.version<s.version){if(f.size!==s.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");r(f.buffer,s,l),f.version=s.version}}return{get:o,remove:i,update:a}}var jp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Qp=`#ifdef USE_ALPHAHASH
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
#endif`,Jp=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,em=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,tm=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,nm=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,rm=`#ifdef USE_AOMAP
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
#endif`,om=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,im=`#ifdef USE_BATCHING
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
#endif`,am=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,sm=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,lm=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,cm=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,fm=`#ifdef USE_IRIDESCENCE
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
#endif`,um=`#ifdef USE_BUMPMAP
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
#endif`,dm=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,hm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,pm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,mm=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,gm=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,_m=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,vm=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Sm=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,xm=`#define PI 3.141592653589793
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
} // validated`,Em=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Mm=`vec3 transformedNormal = objectNormal;
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
#endif`,Tm=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,bm=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,wm=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Am=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Rm="gl_FragColor = linearToOutputTexel( gl_FragColor );",ym=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Cm=`#ifdef USE_ENVMAP
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
#endif`,Pm=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Lm=`#ifdef USE_ENVMAP
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
#endif`,Dm=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Um=`#ifdef USE_ENVMAP
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
#endif`,Im=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Nm=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Om=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Fm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Hm=`#ifdef USE_GRADIENTMAP
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
}`,Bm=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Gm=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,km=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Vm=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,zm=`#ifdef USE_ENVMAP
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
#endif`,Wm=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Xm=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,$m=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Km=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Ym=`PhysicalMaterial material;
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
#endif`,qm=`uniform sampler2D dfgLUT;
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
}`,Zm=`
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
#endif`,jm=`#if defined( RE_IndirectDiffuse )
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
#endif`,Qm=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Jm=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,e0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,t0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,n0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,r0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,o0=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,i0=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,a0=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,s0=`#if defined( USE_POINTS_UV )
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
#endif`,l0=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,c0=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,f0=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,u0=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,d0=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,h0=`#ifdef USE_MORPHTARGETS
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
#endif`,p0=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,m0=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,g0=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,_0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,v0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,S0=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,x0=`#ifdef USE_NORMALMAP
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
#endif`,E0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,M0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,T0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,b0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,w0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,A0=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,R0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,y0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,C0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,P0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,L0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,D0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,U0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,I0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,N0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,O0=`float getShadowMask() {
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
}`,F0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,H0=`#ifdef USE_SKINNING
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
#endif`,B0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,G0=`#ifdef USE_SKINNING
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
#endif`,k0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,V0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,z0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,W0=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,X0=`#ifdef USE_TRANSMISSION
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
#endif`,$0=`#ifdef USE_TRANSMISSION
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
#endif`,K0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Y0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,q0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Z0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,j0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Q0=`uniform sampler2D t2D;
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
}`,J0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,eg=`#ifdef ENVMAP_TYPE_CUBE
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
}`,tg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ng=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,rg=`#include <common>
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
}`,og=`#if DEPTH_PACKING == 3200
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
}`,ig=`#define DISTANCE
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
}`,ag=`#define DISTANCE
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
}`,sg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,lg=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cg=`uniform float scale;
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
}`,fg=`uniform vec3 diffuse;
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
}`,ug=`#include <common>
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
}`,dg=`uniform vec3 diffuse;
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
}`,hg=`#define LAMBERT
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
}`,pg=`#define LAMBERT
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
}`,mg=`#define MATCAP
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
}`,gg=`#define MATCAP
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
}`,_g=`#define NORMAL
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
}`,vg=`#define NORMAL
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
}`,Sg=`#define PHONG
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
}`,xg=`#define PHONG
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
}`,Eg=`#define STANDARD
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
}`,Mg=`#define STANDARD
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
}`,Tg=`#define TOON
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
}`,bg=`#define TOON
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
}`,wg=`uniform float size;
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
}`,Ag=`uniform vec3 diffuse;
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
}`,Rg=`#include <common>
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
}`,yg=`uniform vec3 color;
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
}`,Cg=`uniform float rotation;
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
}`,Pg=`uniform vec3 diffuse;
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
}`,Ce={alphahash_fragment:jp,alphahash_pars_fragment:Qp,alphamap_fragment:Jp,alphamap_pars_fragment:em,alphatest_fragment:tm,alphatest_pars_fragment:nm,aomap_fragment:rm,aomap_pars_fragment:om,batching_pars_vertex:im,batching_vertex:am,begin_vertex:sm,beginnormal_vertex:lm,bsdfs:cm,iridescence_fragment:fm,bumpmap_pars_fragment:um,clipping_planes_fragment:dm,clipping_planes_pars_fragment:hm,clipping_planes_pars_vertex:pm,clipping_planes_vertex:mm,color_fragment:gm,color_pars_fragment:_m,color_pars_vertex:vm,color_vertex:Sm,common:xm,cube_uv_reflection_fragment:Em,defaultnormal_vertex:Mm,displacementmap_pars_vertex:Tm,displacementmap_vertex:bm,emissivemap_fragment:wm,emissivemap_pars_fragment:Am,colorspace_fragment:Rm,colorspace_pars_fragment:ym,envmap_fragment:Cm,envmap_common_pars_fragment:Pm,envmap_pars_fragment:Lm,envmap_pars_vertex:Dm,envmap_physical_pars_fragment:zm,envmap_vertex:Um,fog_vertex:Im,fog_pars_vertex:Nm,fog_fragment:Om,fog_pars_fragment:Fm,gradientmap_pars_fragment:Hm,lightmap_pars_fragment:Bm,lights_lambert_fragment:Gm,lights_lambert_pars_fragment:km,lights_pars_begin:Vm,lights_toon_fragment:Wm,lights_toon_pars_fragment:Xm,lights_phong_fragment:$m,lights_phong_pars_fragment:Km,lights_physical_fragment:Ym,lights_physical_pars_fragment:qm,lights_fragment_begin:Zm,lights_fragment_maps:jm,lights_fragment_end:Qm,lightprobes_pars_fragment:Jm,logdepthbuf_fragment:e0,logdepthbuf_pars_fragment:t0,logdepthbuf_pars_vertex:n0,logdepthbuf_vertex:r0,map_fragment:o0,map_pars_fragment:i0,map_particle_fragment:a0,map_particle_pars_fragment:s0,metalnessmap_fragment:l0,metalnessmap_pars_fragment:c0,morphinstance_vertex:f0,morphcolor_vertex:u0,morphnormal_vertex:d0,morphtarget_pars_vertex:h0,morphtarget_vertex:p0,normal_fragment_begin:m0,normal_fragment_maps:g0,normal_pars_fragment:_0,normal_pars_vertex:v0,normal_vertex:S0,normalmap_pars_fragment:x0,clearcoat_normal_fragment_begin:E0,clearcoat_normal_fragment_maps:M0,clearcoat_pars_fragment:T0,iridescence_pars_fragment:b0,opaque_fragment:w0,packing:A0,premultiplied_alpha_fragment:R0,project_vertex:y0,dithering_fragment:C0,dithering_pars_fragment:P0,roughnessmap_fragment:L0,roughnessmap_pars_fragment:D0,shadowmap_pars_fragment:U0,shadowmap_pars_vertex:I0,shadowmap_vertex:N0,shadowmask_pars_fragment:O0,skinbase_vertex:F0,skinning_pars_vertex:H0,skinning_vertex:B0,skinnormal_vertex:G0,specularmap_fragment:k0,specularmap_pars_fragment:V0,tonemapping_fragment:z0,tonemapping_pars_fragment:W0,transmission_fragment:X0,transmission_pars_fragment:$0,uv_pars_fragment:K0,uv_pars_vertex:Y0,uv_vertex:q0,worldpos_vertex:Z0,background_vert:j0,background_frag:Q0,backgroundCube_vert:J0,backgroundCube_frag:eg,cube_vert:tg,cube_frag:ng,depth_vert:rg,depth_frag:og,distance_vert:ig,distance_frag:ag,equirect_vert:sg,equirect_frag:lg,linedashed_vert:cg,linedashed_frag:fg,meshbasic_vert:ug,meshbasic_frag:dg,meshlambert_vert:hg,meshlambert_frag:pg,meshmatcap_vert:mg,meshmatcap_frag:gg,meshnormal_vert:_g,meshnormal_frag:vg,meshphong_vert:Sg,meshphong_frag:xg,meshphysical_vert:Eg,meshphysical_frag:Mg,meshtoon_vert:Tg,meshtoon_frag:bg,points_vert:wg,points_frag:Ag,shadow_vert:Rg,shadow_frag:yg,sprite_vert:Cg,sprite_frag:Pg},ce={common:{diffuse:{value:new ye(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Be},alphaMap:{value:null},alphaMapTransform:{value:new Be},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Be}},envmap:{envMap:{value:null},envMapRotation:{value:new Be},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Be}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Be}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Be},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Be},normalScale:{value:new je(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Be},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Be}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Be}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Be}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ye(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new te},probesMax:{value:new te},probesResolution:{value:new te}},points:{diffuse:{value:new ye(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Be},alphaTest:{value:0},uvTransform:{value:new Be}},sprite:{diffuse:{value:new ye(16777215)},opacity:{value:1},center:{value:new je(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Be},alphaMap:{value:null},alphaMapTransform:{value:new Be},alphaTest:{value:0}}},tn={basic:{uniforms:Ht([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.fog]),vertexShader:Ce.meshbasic_vert,fragmentShader:Ce.meshbasic_frag},lambert:{uniforms:Ht([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new ye(0)},envMapIntensity:{value:1}}]),vertexShader:Ce.meshlambert_vert,fragmentShader:Ce.meshlambert_frag},phong:{uniforms:Ht([ce.common,ce.specularmap,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,ce.lights,{emissive:{value:new ye(0)},specular:{value:new ye(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ce.meshphong_vert,fragmentShader:Ce.meshphong_frag},standard:{uniforms:Ht([ce.common,ce.envmap,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.roughnessmap,ce.metalnessmap,ce.fog,ce.lights,{emissive:{value:new ye(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ce.meshphysical_vert,fragmentShader:Ce.meshphysical_frag},toon:{uniforms:Ht([ce.common,ce.aomap,ce.lightmap,ce.emissivemap,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.gradientmap,ce.fog,ce.lights,{emissive:{value:new ye(0)}}]),vertexShader:Ce.meshtoon_vert,fragmentShader:Ce.meshtoon_frag},matcap:{uniforms:Ht([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,ce.fog,{matcap:{value:null}}]),vertexShader:Ce.meshmatcap_vert,fragmentShader:Ce.meshmatcap_frag},points:{uniforms:Ht([ce.points,ce.fog]),vertexShader:Ce.points_vert,fragmentShader:Ce.points_frag},dashed:{uniforms:Ht([ce.common,ce.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ce.linedashed_vert,fragmentShader:Ce.linedashed_frag},depth:{uniforms:Ht([ce.common,ce.displacementmap]),vertexShader:Ce.depth_vert,fragmentShader:Ce.depth_frag},normal:{uniforms:Ht([ce.common,ce.bumpmap,ce.normalmap,ce.displacementmap,{opacity:{value:1}}]),vertexShader:Ce.meshnormal_vert,fragmentShader:Ce.meshnormal_frag},sprite:{uniforms:Ht([ce.sprite,ce.fog]),vertexShader:Ce.sprite_vert,fragmentShader:Ce.sprite_frag},background:{uniforms:{uvTransform:{value:new Be},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ce.background_vert,fragmentShader:Ce.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Be}},vertexShader:Ce.backgroundCube_vert,fragmentShader:Ce.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ce.cube_vert,fragmentShader:Ce.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ce.equirect_vert,fragmentShader:Ce.equirect_frag},distance:{uniforms:Ht([ce.common,ce.displacementmap,{referencePosition:{value:new te},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ce.distance_vert,fragmentShader:Ce.distance_frag},shadow:{uniforms:Ht([ce.lights,ce.fog,{color:{value:new ye(0)},opacity:{value:1}}]),vertexShader:Ce.shadow_vert,fragmentShader:Ce.shadow_frag}};tn.physical={uniforms:Ht([tn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Be},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Be},clearcoatNormalScale:{value:new je(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Be},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Be},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Be},sheen:{value:0},sheenColor:{value:new ye(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Be},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Be},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Be},transmissionSamplerSize:{value:new je},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Be},attenuationDistance:{value:0},attenuationColor:{value:new ye(0)},specularColor:{value:new ye(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Be},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Be},anisotropyVector:{value:new je},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Be}}]),vertexShader:Ce.meshphysical_vert,fragmentShader:Ce.meshphysical_frag};var hi={r:0,b:0,g:0},Lg=new Yt,Lu=new Be;Lu.set(-1,0,0,0,1,0,0,0,1);function Dg(e,n,t,r,o,i){let a=new ye(0),s=o===!0?0:1,l,f,c=null,u=0,d=null;function h(v){let x=v.isScene===!0?v.background:null;if(x&&x.isTexture){let g=v.backgroundBlurriness>0;x=n.get(x,g)}return x}function _(v){let x=!1,g=h(v);g===null?p(a,s):g&&g.isColor&&(p(g,1),x=!0);let M=e.xr.getEnvironmentBlendMode();M==="additive"?t.buffers.color.setClear(0,0,0,1,i):M==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,i),(e.autoClear||x)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function T(v,x){let g=h(x);g&&(g.isCubeTexture||g.mapping===co)?(f===void 0&&(f=new yt(new fi(1,1,1),new en({name:"BackgroundCubeMaterial",uniforms:di(tn.backgroundCube.uniforms),vertexShader:tn.backgroundCube.vertexShader,fragmentShader:tn.backgroundCube.fragmentShader,side:kt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),f.geometry.deleteAttribute("normal"),f.geometry.deleteAttribute("uv"),f.onBeforeRender=function(M,b,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(f.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(f)),f.material.uniforms.envMap.value=g,f.material.uniforms.backgroundBlurriness.value=x.backgroundBlurriness,f.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,f.material.uniforms.backgroundRotation.value.setFromMatrix4(Lg.makeRotationFromEuler(x.backgroundRotation)).transpose(),g.isCubeTexture&&g.isRenderTargetTexture===!1&&f.material.uniforms.backgroundRotation.value.premultiply(Lu),f.material.toneMapped=ct.getTransfer(g.colorSpace)!==tt,(c!==g||u!==g.version||d!==e.toneMapping)&&(f.material.needsUpdate=!0,c=g,u=g.version,d=e.toneMapping),f.layers.enableAll(),v.unshift(f,f.geometry,f.material,0,0,null)):g&&g.isTexture&&(l===void 0&&(l=new yt(new Lt(2,2),new en({name:"BackgroundMaterial",uniforms:di(tn.background.uniforms),vertexShader:tn.background.vertexShader,fragmentShader:tn.background.fragmentShader,side:yr,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(l)),l.material.uniforms.t2D.value=g,l.material.uniforms.backgroundIntensity.value=x.backgroundIntensity,l.material.toneMapped=ct.getTransfer(g.colorSpace)!==tt,g.matrixAutoUpdate===!0&&g.updateMatrix(),l.material.uniforms.uvTransform.value.copy(g.matrix),(c!==g||u!==g.version||d!==e.toneMapping)&&(l.material.needsUpdate=!0,c=g,u=g.version,d=e.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}function p(v,x){v.getRGB(hi,xs(e)),t.buffers.color.setClear(hi.r,hi.g,hi.b,x,i)}function m(){f!==void 0&&(f.geometry.dispose(),f.material.dispose(),f=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(v,x=1){a.set(v),s=x,p(a,s)},getClearAlpha:function(){return s},setClearAlpha:function(v){s=v,p(a,s)},render:_,addToRenderList:T,dispose:m}}function Ug(e,n){let t=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},o=d(null),i=o,a=!1;function s(P,D,U,L,H){let z=!1,F=u(P,L,U,D);i!==F&&(i=F,f(i.object)),z=h(P,L,U,H),z&&_(P,L,U,H),H!==null&&n.update(H,e.ELEMENT_ARRAY_BUFFER),(z||a)&&(a=!1,g(P,D,U,L),H!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,n.get(H).buffer))}function l(){return e.createVertexArray()}function f(P){return e.bindVertexArray(P)}function c(P){return e.deleteVertexArray(P)}function u(P,D,U,L){let H=L.wireframe===!0,z=r[D.id];z===void 0&&(z={},r[D.id]=z);let F=P.isInstancedMesh===!0?P.id:0,X=z[F];X===void 0&&(X={},z[F]=X);let $=X[U.id];$===void 0&&($={},X[U.id]=$);let j=$[H];return j===void 0&&(j=d(l()),$[H]=j),j}function d(P){let D=[],U=[],L=[];for(let H=0;H<t;H++)D[H]=0,U[H]=0,L[H]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:D,enabledAttributes:U,attributeDivisors:L,object:P,attributes:{},index:null}}function h(P,D,U,L){let H=i.attributes,z=D.attributes,F=0,X=U.getAttributes();for(let $ in X)if(X[$].location>=0){let Z=H[$],ge=z[$];if(ge===void 0&&($==="instanceMatrix"&&P.instanceMatrix&&(ge=P.instanceMatrix),$==="instanceColor"&&P.instanceColor&&(ge=P.instanceColor)),Z===void 0||Z.attribute!==ge||ge&&Z.data!==ge.data)return!0;F++}return i.attributesNum!==F||i.index!==L}function _(P,D,U,L){let H={},z=D.attributes,F=0,X=U.getAttributes();for(let $ in X)if(X[$].location>=0){let Z=z[$];Z===void 0&&($==="instanceMatrix"&&P.instanceMatrix&&(Z=P.instanceMatrix),$==="instanceColor"&&P.instanceColor&&(Z=P.instanceColor));let ge={};ge.attribute=Z,Z&&Z.data&&(ge.data=Z.data),H[$]=ge,F++}i.attributes=H,i.attributesNum=F,i.index=L}function T(){let P=i.newAttributes;for(let D=0,U=P.length;D<U;D++)P[D]=0}function p(P){m(P,0)}function m(P,D){let U=i.newAttributes,L=i.enabledAttributes,H=i.attributeDivisors;U[P]=1,L[P]===0&&(e.enableVertexAttribArray(P),L[P]=1),H[P]!==D&&(e.vertexAttribDivisor(P,D),H[P]=D)}function v(){let P=i.newAttributes,D=i.enabledAttributes;for(let U=0,L=D.length;U<L;U++)D[U]!==P[U]&&(e.disableVertexAttribArray(U),D[U]=0)}function x(P,D,U,L,H,z,F){F===!0?e.vertexAttribIPointer(P,D,U,H,z):e.vertexAttribPointer(P,D,U,L,H,z)}function g(P,D,U,L){T();let H=L.attributes,z=U.getAttributes(),F=D.defaultAttributeValues;for(let X in z){let $=z[X];if($.location>=0){let j=H[X];if(j===void 0&&(X==="instanceMatrix"&&P.instanceMatrix&&(j=P.instanceMatrix),X==="instanceColor"&&P.instanceColor&&(j=P.instanceColor)),j!==void 0){let Z=j.normalized,ge=j.itemSize,Ee=n.get(j);if(Ee===void 0)continue;let ze=Ee.buffer,$e=Ee.type,We=Ee.bytesPerElement,q=$e===e.INT||$e===e.UNSIGNED_INT||j.gpuType===ba;if(j.isInterleavedBufferAttribute){let J=j.data,xe=J.stride,Ue=j.offset;if(J.isInstancedInterleavedBuffer){for(let _e=0;_e<$.locationSize;_e++)m($.location+_e,J.meshPerAttribute);P.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let _e=0;_e<$.locationSize;_e++)p($.location+_e);e.bindBuffer(e.ARRAY_BUFFER,ze);for(let _e=0;_e<$.locationSize;_e++)x($.location+_e,ge/$.locationSize,$e,Z,xe*We,(Ue+ge/$.locationSize*_e)*We,q)}else{if(j.isInstancedBufferAttribute){for(let J=0;J<$.locationSize;J++)m($.location+J,j.meshPerAttribute);P.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let J=0;J<$.locationSize;J++)p($.location+J);e.bindBuffer(e.ARRAY_BUFFER,ze);for(let J=0;J<$.locationSize;J++)x($.location+J,ge/$.locationSize,$e,Z,ge*We,ge/$.locationSize*J*We,q)}}else if(F!==void 0){let Z=F[X];if(Z!==void 0)switch(Z.length){case 2:e.vertexAttrib2fv($.location,Z);break;case 3:e.vertexAttrib3fv($.location,Z);break;case 4:e.vertexAttrib4fv($.location,Z);break;default:e.vertexAttrib1fv($.location,Z)}}}}v()}function M(){w();for(let P in r){let D=r[P];for(let U in D){let L=D[U];for(let H in L){let z=L[H];for(let F in z)c(z[F].object),delete z[F];delete L[H]}}delete r[P]}}function b(P){if(r[P.id]===void 0)return;let D=r[P.id];for(let U in D){let L=D[U];for(let H in L){let z=L[H];for(let F in z)c(z[F].object),delete z[F];delete L[H]}}delete r[P.id]}function A(P){for(let D in r){let U=r[D];for(let L in U){let H=U[L];if(H[P.id]===void 0)continue;let z=H[P.id];for(let F in z)c(z[F].object),delete z[F];delete H[P.id]}}}function S(P){for(let D in r){let U=r[D],L=P.isInstancedMesh===!0?P.id:0,H=U[L];if(H!==void 0){for(let z in H){let F=H[z];for(let X in F)c(F[X].object),delete F[X];delete H[z]}delete U[L],Object.keys(U).length===0&&delete r[D]}}}function w(){y(),a=!0,i!==o&&(i=o,f(i.object))}function y(){o.geometry=null,o.program=null,o.wireframe=!1}return{setup:s,reset:w,resetDefaultState:y,dispose:M,releaseStatesOfGeometry:b,releaseStatesOfObject:S,releaseStatesOfProgram:A,initAttributes:T,enableAttribute:p,disableUnusedAttributes:v}}function Ig(e,n,t){let r;function o(l){r=l}function i(l,f){e.drawArrays(r,l,f),t.update(f,r,1)}function a(l,f,c){c!==0&&(e.drawArraysInstanced(r,l,f,c),t.update(f,r,c))}function s(l,f,c){if(c===0)return;n.get("WEBGL_multi_draw").multiDrawArraysWEBGL(r,l,0,f,0,c);let d=0;for(let h=0;h<c;h++)d+=f[h];t.update(d,r,1)}this.setMode=o,this.render=i,this.renderInstances=a,this.renderMultiDraw=s}function Ng(e,n,t,r){let o;function i(){if(o!==void 0)return o;if(n.has("EXT_texture_filter_anisotropic")===!0){let A=n.get("EXT_texture_filter_anisotropic");o=e.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else o=0;return o}function a(A){return!(A!==Qt&&r.convert(A)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function s(A){let S=A===xn&&(n.has("EXT_color_buffer_half_float")||n.has("EXT_color_buffer_float"));return!(A!==$t&&A!==Cn&&!S&&r.convert(A)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function l(A){if(A==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let f=t.precision!==void 0?t.precision:"highp",c=l(f);c!==f&&(qe("WebGLRenderer:",f,"not supported, using",c,"instead."),f=c);let u=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&n.has("EXT_clip_control");t.reversedDepthBuffer===!0&&d===!1&&qe("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let h=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),_=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),T=e.getParameter(e.MAX_TEXTURE_SIZE),p=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),m=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),x=e.getParameter(e.MAX_VARYING_VECTORS),g=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),M=e.getParameter(e.MAX_SAMPLES),b=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:i,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:s,precision:f,logarithmicDepthBuffer:u,reversedDepthBuffer:d,maxTextures:h,maxVertexTextures:_,maxTextureSize:T,maxCubemapSize:p,maxAttributes:m,maxVertexUniforms:v,maxVaryings:x,maxFragmentUniforms:g,maxSamples:M,samples:b}}function Og(e){let n=this,t=null,r=0,o=!1,i=!1,a=new Xf,s=new Be,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let h=u.length!==0||d||r!==0||o;return o=d,r=u.length,h},this.beginShadows=function(){i=!0,c(null)},this.endShadows=function(){i=!1},this.setGlobalState=function(u,d){t=c(u,d,0)},this.setState=function(u,d,h){let _=u.clippingPlanes,T=u.clipIntersection,p=u.clipShadows,m=e.get(u);if(!o||_===null||_.length===0||i&&!p)i?c(null):f();else{let v=i?0:r,x=v*4,g=m.clippingState||null;l.value=g,g=c(_,d,x,h);for(let M=0;M!==x;++M)g[M]=t[M];m.clippingState=g,this.numIntersection=T?this.numPlanes:0,this.numPlanes+=v}};function f(){l.value!==t&&(l.value=t,l.needsUpdate=r>0),n.numPlanes=r,n.numIntersection=0}function c(u,d,h,_){let T=u!==null?u.length:0,p=null;if(T!==0){if(p=l.value,_!==!0||p===null){let m=h+T*4,v=d.matrixWorldInverse;s.getNormalMatrix(v),(p===null||p.length<m)&&(p=new Float32Array(m));for(let x=0,g=h;x!==T;++x,g+=4)a.copy(u[x]).applyMatrix4(v,s),a.normal.toArray(p,g),p[g+3]=a.constant}l.value=p,l.needsUpdate=!0}return n.numPlanes=T,n.numIntersection=0,p}}var Or=4,Fg=6,Hg=20,Bg=256,vo=new Ms,lu=new ye,Cs=null,Ps=0,Ls=0,Ds=!1,Gg=new te,or=new te,mi=class{constructor(n){this._renderer=n,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(n,t=0,r=.1,o=100,i={}){let{size:a=256,position:s=Gg}=i;Cs=this._renderer.getRenderTarget(),Ps=this._renderer.getActiveCubeFace(),Ls=this._renderer.getActiveMipmapLevel(),Ds=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(n,r,o,l,s),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(n,t=null){return this._fromTexture(n,t)}fromCubemap(n,t=null){return this._fromTexture(n,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=uu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=fu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(n){this._lodMax=Math.floor(Math.log2(n)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let n=0;n<this._lodMeshes.length;n++)this._lodMeshes[n].geometry.dispose()}_cleanup(n){this._renderer.setRenderTarget(Cs,Ps,Ls),this._renderer.xr.enabled=Ds,n.scissorTest=!1,Nr(n,0,0,n.width,n.height)}_fromTexture(n,t){n.mapping===Pr||n.mapping===Jn?this._setSize(n.image.length===0?16:n.image[0].width||n.image[0].image.width):this._setSize(n.image.width/4),Cs=this._renderer.getRenderTarget(),Ps=this._renderer.getActiveCubeFace(),Ls=this._renderer.getActiveMipmapLevel(),Ds=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let r=t||this._allocateTargets();return this._textureToCubeUV(n,r),this._applyPMREM(r),this._cleanup(r),r}_allocateTargets(){let n=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,r={magFilter:St,minFilter:St,generateMipmaps:!1,type:xn,format:Qt,colorSpace:ss,depthBuffer:!1},o=cu(n,t,r);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==n||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=cu(n,t,r);let{_lodMax:i}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=kg(i)),this._blurMaterial=zg(i,n,t),this._ggxMaterial=Vg(i,n,t)}return o}_compileMaterial(n){let t=new yt(new xt,n);this._renderer.compile(t,vo)}_sceneToCubeUV(n,t,r,o,i){let l=new mo(90,1,t,r),f=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,h=u.toneMapping;u.getClearColor(lu),u.toneMapping=cn,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(o),u.clearDepth(),u.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new yt(new fi,new $f({name:"PMREM.Background",side:kt,depthWrite:!1,depthTest:!1})));let T=this._backgroundBox,p=T.material,m=!1,v=n.background;v?v.isColor&&(p.color.copy(v),n.background=null,m=!0):(p.color.copy(lu),m=!0);for(let x=0;x<6;x++){let g=x%3;g===0?(l.up.set(0,f[x],0),l.position.set(i.x,i.y,i.z),l.lookAt(i.x+c[x],i.y,i.z)):g===1?(l.up.set(0,0,f[x]),l.position.set(i.x,i.y,i.z),l.lookAt(i.x,i.y+c[x],i.z)):(l.up.set(0,f[x],0),l.position.set(i.x,i.y,i.z),l.lookAt(i.x,i.y,i.z+c[x]));let M=this._cubeSize;Nr(o,g*M,x>2?M:0,M,M),u.setRenderTarget(o),m&&u.render(T,l),u.render(n,l)}u.toneMapping=h,u.autoClear=d,n.background=v}_textureToCubeUV(n,t){let r=this._renderer,o=n.mapping===Pr||n.mapping===Jn;o?(this._cubemapMaterial===null&&(this._cubemapMaterial=uu()),this._cubemapMaterial.uniforms.flipEnvMap.value=n.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=fu());let i=o?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=i;let s=i.uniforms;s.envMap.value=n;let l=this._cubeSize;Nr(t,0,0,3*l,2*l),r.setRenderTarget(t),r.render(a,vo)}_applyPMREM(n){let t=this._renderer,r=t.autoClear;t.autoClear=!1;let o=this._lodMeshes.length;for(let i=1;i<o;i++)this._applyGGXFilter(n,i-1,i);t.autoClear=r}_applyGGXFilter(n,t,r){let o=this._renderer,i=this._pingPongRenderTarget,a=this._ggxMaterial,s=this._lodMeshes[r];s.material=a;let l=a.uniforms,f=r/(this._lodMeshes.length-1),c=t/(this._lodMeshes.length-1),u=Math.sqrt(f*f-c*c),d=f*1.25,h=u*d,{_lodMax:_}=this,T=this._sizeLods[r],p=3*T*(r>_-Or?r-_+Or:0),m=4*(this._cubeSize-T);l.envMap.value=n.texture,l.roughness.value=h,l.mipInt.value=_-t,Nr(i,p,m,3*T,2*T),o.setRenderTarget(i),o.render(s,vo),l.envMap.value=i.texture,l.roughness.value=0,l.mipInt.value=_-r,Nr(n,p,m,3*T,2*T),o.setRenderTarget(n),o.render(s,vo)}_blur(n,t,r,o){let i=this._pingPongRenderTarget,a=Math.min(o,Math.PI)/Math.SQRT2;this._blurPass(n,i,t,r,a),this._blurPass(i,n,r,r,a)}_blurPass(n,t,r,o,i){let a=this._renderer,s=this._blurMaterial,l=this._lodMeshes[o];l.material=s;let f=s.uniforms;f.envMap.value=n.texture,f.sigma.value=i,f.mipInt.value=this._lodMax-r;let c=this._sizeLods[o],u=3*c*(o>this._lodMax-Or?o-this._lodMax+Or:0),d=4*(this._cubeSize-c);Nr(t,u,d,3*c,2*c),a.setRenderTarget(t),a.render(l,vo)}};function kg(e){let n=[],t=[],r=e,o=e-Or+1+Fg;for(let i=0;i<o;i++){let a=Math.pow(2,r);n.push(a);let s=1/(a-2),l=-s,f=1+s,c=[l,l,f,l,f,f,l,l,f,f,l,f],u=6,d=6,h=3,_=new Float32Array(h*d*u),T=new Float32Array(h*d*u);for(let m=0;m<u;m++){let v=m%3*2/3-1,x=m>2?0:-1,g=[v,x,0,v+2/3,x,0,v+2/3,x+1,0,v,x,0,v+2/3,x+1,0,v,x+1,0];_.set(g,h*d*m);for(let M=0;M<d;M++){let b=c[M*2]*2-1,A=c[M*2+1]*2-1;m===0?or.set(1,A,b):m===1?or.set(-b,1,-A):m===2?or.set(-b,A,1):m===3?or.set(-1,A,-b):m===4?or.set(-b,-1,A):or.set(b,A,-1),or.toArray(T,(m*d+M)*h)}}let p=new xt;p.setAttribute("position",new Oe(_,h)),p.setAttribute("outputDirection",new Oe(T,h)),t.push(new yt(p,null)),r>Or&&r--}return{lodMeshes:t,sizeLods:n}}function cu(e,n,t){let r=new Jt(e,n,t);return r.texture.mapping=co,r.texture.name="PMREM.cubeUv",r.scissorTest=!0,r}function Nr(e,n,t,r,o){e.viewport.set(n,t,r,o),e.scissor.set(n,t,r,o)}function Vg(e,n,t){return new en({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Bg,CUBEUV_TEXEL_WIDTH:1/n,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:_i(),fragmentShader:`

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
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function zg(e,n,t){return new en({name:"SphericalGaussianBlur",defines:{SAMPLES:Hg,CUBEUV_TEXEL_WIDTH:1/n,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:_i(),fragmentShader:`

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
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function fu(){return new en({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:_i(),fragmentShader:`

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
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function uu(){return new en({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:_i(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function _i(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var gi=class extends Jt{constructor(n=1,t={}){super(n,n,t),this.isWebGLCubeRenderTarget=!0;let r={width:n,height:n,depth:1},o=[r,r,r,r,r,r];this.texture=new _s(o),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(n,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let r={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},o=new fi(5,5,5),i=new en({name:"CubemapFromEquirect",uniforms:di(r.uniforms),vertexShader:r.vertexShader,fragmentShader:r.fragmentShader,side:kt,blending:Sn});i.uniforms.tEquirect.value=t;let a=new yt(o,i),s=t.minFilter;return t.minFilter===Xt&&(t.minFilter=St),new Qf(1,10,this).update(n,a),t.minFilter=s,a.geometry.dispose(),a.material.dispose(),this}clear(n,t=!0,r=!0,o=!0){let i=n.getRenderTarget();for(let a=0;a<6;a++)n.setRenderTarget(this,a),n.clear(t,r,o);n.setRenderTarget(i)}};function Wg(e){let n=new WeakMap,t=new WeakMap,r=null;function o(d,h=!1){return d==null?null:h?a(d):i(d)}function i(d){if(d&&d.isTexture){let h=d.mapping;if(h===qo||h===Zo)if(n.has(d)){let _=n.get(d).texture;return s(_,d.mapping)}else{let _=d.image;if(_&&_.height>0){let T=new gi(_.height);return T.fromEquirectangularTexture(e,d),n.set(d,T),d.addEventListener("dispose",f),s(T.texture,d.mapping)}else return null}}return d}function a(d){if(d&&d.isTexture){let h=d.mapping,_=h===qo||h===Zo,T=h===Pr||h===Jn;if(_||T){let p=t.get(d),m=p!==void 0?p.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==m)return r===null&&(r=new mi(e)),p=_?r.fromEquirectangular(d,p):r.fromCubemap(d,p),p.texture.pmremVersion=d.pmremVersion,t.set(d,p),p.texture;if(p!==void 0)return p.texture;{let v=d.image;return _&&v&&v.height>0||T&&v&&l(v)?(r===null&&(r=new mi(e)),p=_?r.fromEquirectangular(d):r.fromCubemap(d),p.texture.pmremVersion=d.pmremVersion,t.set(d,p),d.addEventListener("dispose",c),p.texture):null}}}return d}function s(d,h){return h===qo?d.mapping=Pr:h===Zo&&(d.mapping=Jn),d}function l(d){let h=0,_=6;for(let T=0;T<_;T++)d[T]!==void 0&&h++;return h===_}function f(d){let h=d.target;h.removeEventListener("dispose",f);let _=n.get(h);_!==void 0&&(n.delete(h),_.dispose())}function c(d){let h=d.target;h.removeEventListener("dispose",c);let _=t.get(h);_!==void 0&&(t.delete(h),_.dispose())}function u(){n=new WeakMap,t=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:o,dispose:u}}function Xg(e){let n={};function t(r){if(n[r]!==void 0)return n[r];let o=e.getExtension(r);return n[r]=o,o}return{has:function(r){return t(r)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(r){let o=t(r);return o===null&&Nf("WebGLRenderer: "+r+" extension not supported."),o}}}function $g(e,n,t,r){let o={},i=new WeakMap;function a(u){let d=u.target;d.index!==null&&n.remove(d.index);for(let _ in d.attributes)n.remove(d.attributes[_]);d.removeEventListener("dispose",a),delete o[d.id];let h=i.get(d);h&&(n.remove(h),i.delete(d)),r.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function s(u,d){return o[d.id]===!0||(d.addEventListener("dispose",a),o[d.id]=!0,t.memory.geometries++),d}function l(u){let d=u.attributes;for(let h in d)n.update(d[h],e.ARRAY_BUFFER)}function f(u){let d=[],h=u.index,_=u.attributes.position,T=0;if(_===void 0)return;if(h!==null){let v=h.array;T=h.version;for(let x=0,g=v.length;x<g;x+=3){let M=v[x+0],b=v[x+1],A=v[x+2];d.push(M,b,b,A,A,M)}}else{let v=_.array;T=_.version;for(let x=0,g=v.length/3-1;x<g;x+=3){let M=x+0,b=x+1,A=x+2;d.push(M,b,b,A,A,M)}}let p=new(_.count>=65535?Wf:zf)(d,1);p.version=T;let m=i.get(u);m&&n.remove(m),i.set(u,p)}function c(u){let d=i.get(u);if(d){let h=u.index;h!==null&&d.version<h.version&&f(u)}else f(u);return i.get(u)}return{get:s,update:l,getWireframeAttribute:c}}function Kg(e,n,t){let r;function o(u){r=u}let i,a;function s(u){i=u.type,a=u.bytesPerElement}function l(u,d){e.drawElements(r,d,i,u*a),t.update(d,r,1)}function f(u,d,h){h!==0&&(e.drawElementsInstanced(r,d,i,u*a,h),t.update(d,r,h))}function c(u,d,h){if(h===0)return;n.get("WEBGL_multi_draw").multiDrawElementsWEBGL(r,d,0,i,u,0,h);let T=0;for(let p=0;p<h;p++)T+=d[p];t.update(T,r,1)}this.setMode=o,this.setIndex=s,this.render=l,this.renderInstances=f,this.renderMultiDraw=c}function Yg(e){let n={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function r(i,a,s){switch(t.calls++,a){case e.TRIANGLES:t.triangles+=s*(i/3);break;case e.LINES:t.lines+=s*(i/2);break;case e.LINE_STRIP:t.lines+=s*(i-1);break;case e.LINE_LOOP:t.lines+=s*i;break;case e.POINTS:t.points+=s*i;break;default:it("WebGLInfo: Unknown draw mode:",a);break}}function o(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:n,render:t,programs:null,autoReset:!0,reset:o,update:r}}function qg(e,n,t){let r=new WeakMap,o=new Pt;function i(a,s,l){let f=a.morphTargetInfluences,c=s.morphAttributes.position||s.morphAttributes.normal||s.morphAttributes.color,u=c!==void 0?c.length:0,d=r.get(s);if(d===void 0||d.count!==u){let w=function(){A.dispose(),r.delete(s),s.removeEventListener("dispose",w)};d!==void 0&&d.texture.dispose();let h=s.morphAttributes.position!==void 0,_=s.morphAttributes.normal!==void 0,T=s.morphAttributes.color!==void 0,p=s.morphAttributes.position||[],m=s.morphAttributes.normal||[],v=s.morphAttributes.color||[],x=0;h===!0&&(x=1),_===!0&&(x=2),T===!0&&(x=3);let g=s.attributes.position.count*x,M=1;g>n.maxTextureSize&&(M=Math.ceil(g/n.maxTextureSize),g=n.maxTextureSize);let b=new Float32Array(g*M*4*u),A=new Ur(b,g,M,u);A.type=Cn,A.needsUpdate=!0;let S=x*4;for(let y=0;y<u;y++){let P=p[y],D=m[y],U=v[y],L=g*M*4*y;for(let H=0;H<P.count;H++){let z=H*S;h===!0&&(o.fromBufferAttribute(P,H),b[L+z+0]=o.x,b[L+z+1]=o.y,b[L+z+2]=o.z,b[L+z+3]=0),_===!0&&(o.fromBufferAttribute(D,H),b[L+z+4]=o.x,b[L+z+5]=o.y,b[L+z+6]=o.z,b[L+z+7]=0),T===!0&&(o.fromBufferAttribute(U,H),b[L+z+8]=o.x,b[L+z+9]=o.y,b[L+z+10]=o.z,b[L+z+11]=U.itemSize===4?o.w:1)}}d={count:u,texture:A,size:new je(g,M)},r.set(s,d),s.addEventListener("dispose",w)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(e,"morphTexture",a.morphTexture,t);else{let h=0;for(let T=0;T<f.length;T++)h+=f[T];let _=s.morphTargetsRelative?1:1-h;l.getUniforms().setValue(e,"morphTargetBaseInfluence",_),l.getUniforms().setValue(e,"morphTargetInfluences",f)}l.getUniforms().setValue(e,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(e,"morphTargetsTextureSize",d.size)}return{update:i}}function Zg(e,n,t,r,o){let i=new WeakMap;function a(f){let c=o.render.frame,u=f.geometry,d=n.get(f,u);if(i.get(d)!==c&&(n.update(d),i.set(d,c)),f.isInstancedMesh&&(f.hasEventListener("dispose",l)===!1&&f.addEventListener("dispose",l),i.get(f)!==c&&(t.update(f.instanceMatrix,e.ARRAY_BUFFER),f.instanceColor!==null&&t.update(f.instanceColor,e.ARRAY_BUFFER),i.set(f,c))),f.isSkinnedMesh){let h=f.skeleton;i.get(h)!==c&&(h.update(),i.set(h,c))}return d}function s(){i=new WeakMap}function l(f){let c=f.target;c.removeEventListener("dispose",l),r.releaseStatesOfObject(c),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:a,dispose:s}}var jg={[_a]:"LINEAR_TONE_MAPPING",[va]:"REINHARD_TONE_MAPPING",[Sa]:"CINEON_TONE_MAPPING",[xa]:"ACES_FILMIC_TONE_MAPPING",[Ma]:"AGX_TONE_MAPPING",[Ta]:"NEUTRAL_TONE_MAPPING",[Ea]:"CUSTOM_TONE_MAPPING"};function Qg(e,n,t,r,o,i){let a=new Jt(n,t,{type:e,depthBuffer:o,stencilBuffer:i,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,l=null,f=new xt;f.setAttribute("position",new qt([-1,3,0,-1,-1,0,3,-1,0],3)),f.setAttribute("uv",new qt([0,2,0,0,2,0],2));let c=new qf({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),u=new yt(f,c),d=new Ms(-1,1,1,-1,0,1),h=null,_=null,T=!1,p,m=null,v=[],x=!1;this.setSize=function(g,M){a.setSize(g,M),s!==null&&s.setSize(g,M),l!==null&&l.setSize(g,M);for(let b=0;b<v.length;b++){let A=v[b];A.setSize&&A.setSize(g,M)}},this.setEffects=function(g){v=g,x=v.length>0&&v[0].isRenderPass===!0;let M=a.width,b=a.height;v.length>0&&s===null&&(s=new Jt(M,b,{type:xn,depthBuffer:!1,stencilBuffer:!1}),l=new Jt(M,b,{type:xn,depthBuffer:!1,stencilBuffer:!1}));for(let A=0;A<v.length;A++){let S=v[A];S.setSize&&S.setSize(M,b)}},this.begin=function(g,M){if(T||g.toneMapping===cn&&v.length===0)return!1;if(m=M,M!==null){let b=M.width,A=M.height;(a.width!==b||a.height!==A)&&this.setSize(b,A)}return x===!1&&g.setRenderTarget(a),p=g.toneMapping,g.toneMapping=cn,!0},this.hasRenderPass=function(){return x},this.end=function(g,M){g.toneMapping=p,T=!0;let b=a,A=s;for(let S=0;S<v.length;S++){let w=v[S];w.enabled!==!1&&(w.render(g,A,b,M),w.needsSwap!==!1&&(b=A,A=A===s?l:s))}if(h!==g.outputColorSpace||_!==g.toneMapping){h=g.outputColorSpace,_=g.toneMapping,c.defines={},ct.getTransfer(h)===tt&&(c.defines.SRGB_TRANSFER="");let S=jg[_];S&&(c.defines[S]=""),c.needsUpdate=!0}c.uniforms.tDiffuse.value=b.texture,g.setRenderTarget(m),g.render(u,d),m=null,T=!1},this.isCompositing=function(){return T},this.dispose=function(){a.dispose(),s!==null&&s.dispose(),l!==null&&l.dispose(),f.dispose(),c.dispose()}}var Du=new Gf,Ns=new po(1,1),Uu=new Ur,Iu=new kf,Nu=new _s,du=[],hu=[],pu=new Float32Array(16),mu=new Float32Array(9),gu=new Float32Array(4);function Hr(e,n,t){let r=e[0];if(r<=0||r>0)return e;let o=n*t,i=du[o];if(i===void 0&&(i=new Float32Array(o),du[o]=i),n!==0){r.toArray(i,0);for(let a=1,s=0;a!==n;++a)s+=t,e[a].toArray(i,s)}return i}function Tt(e,n){if(e.length!==n.length)return!1;for(let t=0,r=e.length;t<r;t++)if(e[t]!==n[t])return!1;return!0}function bt(e,n){for(let t=0,r=n.length;t<r;t++)e[t]=n[t]}function vi(e,n){let t=hu[n];t===void 0&&(t=new Int32Array(n),hu[n]=t);for(let r=0;r!==n;++r)t[r]=e.allocateTextureUnit();return t}function Jg(e,n){let t=this.cache;t[0]!==n&&(e.uniform1f(this.addr,n),t[0]=n)}function e_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2f(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(Tt(t,n))return;e.uniform2fv(this.addr,n),bt(t,n)}}function t_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3f(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else if(n.r!==void 0)(t[0]!==n.r||t[1]!==n.g||t[2]!==n.b)&&(e.uniform3f(this.addr,n.r,n.g,n.b),t[0]=n.r,t[1]=n.g,t[2]=n.b);else{if(Tt(t,n))return;e.uniform3fv(this.addr,n),bt(t,n)}}function n_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4f(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(Tt(t,n))return;e.uniform4fv(this.addr,n),bt(t,n)}}function r_(e,n){let t=this.cache,r=n.elements;if(r===void 0){if(Tt(t,n))return;e.uniformMatrix2fv(this.addr,!1,n),bt(t,n)}else{if(Tt(t,r))return;gu.set(r),e.uniformMatrix2fv(this.addr,!1,gu),bt(t,r)}}function o_(e,n){let t=this.cache,r=n.elements;if(r===void 0){if(Tt(t,n))return;e.uniformMatrix3fv(this.addr,!1,n),bt(t,n)}else{if(Tt(t,r))return;mu.set(r),e.uniformMatrix3fv(this.addr,!1,mu),bt(t,r)}}function i_(e,n){let t=this.cache,r=n.elements;if(r===void 0){if(Tt(t,n))return;e.uniformMatrix4fv(this.addr,!1,n),bt(t,n)}else{if(Tt(t,r))return;pu.set(r),e.uniformMatrix4fv(this.addr,!1,pu),bt(t,r)}}function a_(e,n){let t=this.cache;t[0]!==n&&(e.uniform1i(this.addr,n),t[0]=n)}function s_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2i(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(Tt(t,n))return;e.uniform2iv(this.addr,n),bt(t,n)}}function l_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3i(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else{if(Tt(t,n))return;e.uniform3iv(this.addr,n),bt(t,n)}}function c_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4i(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(Tt(t,n))return;e.uniform4iv(this.addr,n),bt(t,n)}}function f_(e,n){let t=this.cache;t[0]!==n&&(e.uniform1ui(this.addr,n),t[0]=n)}function u_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y)&&(e.uniform2ui(this.addr,n.x,n.y),t[0]=n.x,t[1]=n.y);else{if(Tt(t,n))return;e.uniform2uiv(this.addr,n),bt(t,n)}}function d_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z)&&(e.uniform3ui(this.addr,n.x,n.y,n.z),t[0]=n.x,t[1]=n.y,t[2]=n.z);else{if(Tt(t,n))return;e.uniform3uiv(this.addr,n),bt(t,n)}}function h_(e,n){let t=this.cache;if(n.x!==void 0)(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w)&&(e.uniform4ui(this.addr,n.x,n.y,n.z,n.w),t[0]=n.x,t[1]=n.y,t[2]=n.z,t[3]=n.w);else{if(Tt(t,n))return;e.uniform4uiv(this.addr,n),bt(t,n)}}function p_(e,n,t){let r=this.cache,o=t.allocateTextureUnit();r[0]!==o&&(e.uniform1i(this.addr,o),r[0]=o);let i;this.type===e.SAMPLER_2D_SHADOW?(Ns.compareFunction=t.isReversedDepthBuffer()?si:ai,i=Ns):i=Du,t.setTexture2D(n||i,o)}function m_(e,n,t){let r=this.cache,o=t.allocateTextureUnit();r[0]!==o&&(e.uniform1i(this.addr,o),r[0]=o),t.setTexture3D(n||Iu,o)}function g_(e,n,t){let r=this.cache,o=t.allocateTextureUnit();r[0]!==o&&(e.uniform1i(this.addr,o),r[0]=o),t.setTextureCube(n||Nu,o)}function __(e,n,t){let r=this.cache,o=t.allocateTextureUnit();r[0]!==o&&(e.uniform1i(this.addr,o),r[0]=o),t.setTexture2DArray(n||Uu,o)}function v_(e){switch(e){case 5126:return Jg;case 35664:return e_;case 35665:return t_;case 35666:return n_;case 35674:return r_;case 35675:return o_;case 35676:return i_;case 5124:case 35670:return a_;case 35667:case 35671:return s_;case 35668:case 35672:return l_;case 35669:case 35673:return c_;case 5125:return f_;case 36294:return u_;case 36295:return d_;case 36296:return h_;case 35678:case 36198:case 36298:case 36306:case 35682:return p_;case 35679:case 36299:case 36307:return m_;case 35680:case 36300:case 36308:case 36293:return g_;case 36289:case 36303:case 36311:case 36292:return __}}function S_(e,n){e.uniform1fv(this.addr,n)}function x_(e,n){let t=Hr(n,this.size,2);e.uniform2fv(this.addr,t)}function E_(e,n){let t=Hr(n,this.size,3);e.uniform3fv(this.addr,t)}function M_(e,n){let t=Hr(n,this.size,4);e.uniform4fv(this.addr,t)}function T_(e,n){let t=Hr(n,this.size,4);e.uniformMatrix2fv(this.addr,!1,t)}function b_(e,n){let t=Hr(n,this.size,9);e.uniformMatrix3fv(this.addr,!1,t)}function w_(e,n){let t=Hr(n,this.size,16);e.uniformMatrix4fv(this.addr,!1,t)}function A_(e,n){e.uniform1iv(this.addr,n)}function R_(e,n){e.uniform2iv(this.addr,n)}function y_(e,n){e.uniform3iv(this.addr,n)}function C_(e,n){e.uniform4iv(this.addr,n)}function P_(e,n){e.uniform1uiv(this.addr,n)}function L_(e,n){e.uniform2uiv(this.addr,n)}function D_(e,n){e.uniform3uiv(this.addr,n)}function U_(e,n){e.uniform4uiv(this.addr,n)}function I_(e,n,t){let r=this.cache,o=n.length,i=vi(t,o);Tt(r,i)||(e.uniform1iv(this.addr,i),bt(r,i));let a;this.type===e.SAMPLER_2D_SHADOW?a=Ns:a=Du;for(let s=0;s!==o;++s)t.setTexture2D(n[s]||a,i[s])}function N_(e,n,t){let r=this.cache,o=n.length,i=vi(t,o);Tt(r,i)||(e.uniform1iv(this.addr,i),bt(r,i));for(let a=0;a!==o;++a)t.setTexture3D(n[a]||Iu,i[a])}function O_(e,n,t){let r=this.cache,o=n.length,i=vi(t,o);Tt(r,i)||(e.uniform1iv(this.addr,i),bt(r,i));for(let a=0;a!==o;++a)t.setTextureCube(n[a]||Nu,i[a])}function F_(e,n,t){let r=this.cache,o=n.length,i=vi(t,o);Tt(r,i)||(e.uniform1iv(this.addr,i),bt(r,i));for(let a=0;a!==o;++a)t.setTexture2DArray(n[a]||Uu,i[a])}function H_(e){switch(e){case 5126:return S_;case 35664:return x_;case 35665:return E_;case 35666:return M_;case 35674:return T_;case 35675:return b_;case 35676:return w_;case 5124:case 35670:return A_;case 35667:case 35671:return R_;case 35668:case 35672:return y_;case 35669:case 35673:return C_;case 5125:return P_;case 36294:return L_;case 36295:return D_;case 36296:return U_;case 35678:case 36198:case 36298:case 36306:case 35682:return I_;case 35679:case 36299:case 36307:return N_;case 35680:case 36300:case 36308:case 36293:return O_;case 36289:case 36303:case 36311:case 36292:return F_}}var Os=class{constructor(n,t,r){this.id=n,this.addr=r,this.cache=[],this.type=t.type,this.setValue=v_(t.type)}},Fs=class{constructor(n,t,r){this.id=n,this.addr=r,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=H_(t.type)}},Hs=class{constructor(n){this.id=n,this.seq=[],this.map={}}setValue(n,t,r){let o=this.seq;for(let i=0,a=o.length;i!==a;++i){let s=o[i];s.setValue(n,t[s.id],r)}}},Us=/(\w+)(\])?(\[|\.)?/g;function _u(e,n){e.seq.push(n),e.map[n.id]=n}function B_(e,n,t){let r=e.name,o=r.length;for(Us.lastIndex=0;;){let i=Us.exec(r),a=Us.lastIndex,s=i[1],l=i[2]==="]",f=i[3];if(l&&(s=s|0),f===void 0||f==="["&&a+2===o){_u(t,f===void 0?new Os(s,e,n):new Fs(s,e,n));break}else{let u=t.map[s];u===void 0&&(u=new Hs(s),_u(t,u)),t=u}}}var Fr=class{constructor(n,t){this.seq=[],this.map={};let r=n.getProgramParameter(t,n.ACTIVE_UNIFORMS);for(let a=0;a<r;++a){let s=n.getActiveUniform(t,a),l=n.getUniformLocation(t,s.name);B_(s,l,this)}let o=[],i=[];for(let a of this.seq)a.type===n.SAMPLER_2D_SHADOW||a.type===n.SAMPLER_CUBE_SHADOW||a.type===n.SAMPLER_2D_ARRAY_SHADOW?o.push(a):i.push(a);o.length>0&&(this.seq=o.concat(i))}setValue(n,t,r,o){let i=this.map[t];i!==void 0&&i.setValue(n,r,o)}setOptional(n,t,r){let o=t[r];o!==void 0&&this.setValue(n,r,o)}static upload(n,t,r,o){for(let i=0,a=t.length;i!==a;++i){let s=t[i],l=r[s.id];l.needsUpdate!==!1&&s.setValue(n,l.value,o)}}static seqWithValue(n,t){let r=[];for(let o=0,i=n.length;o!==i;++o){let a=n[o];a.id in t&&r.push(a)}return r}};function vu(e,n,t){let r=e.createShader(n);return e.shaderSource(r,t),e.compileShader(r),r}var G_=37297,k_=0;function V_(e,n){let t=e.split(`
`),r=[],o=Math.max(n-6,0),i=Math.min(n+6,t.length);for(let a=o;a<i;a++){let s=a+1;r.push(`${s===n?">":" "} ${s}: ${t[a]}`)}return r.join(`
`)}var Su=new Be;function z_(e){ct._getMatrix(Su,ct.workingColorSpace,e);let n=`mat3( ${Su.elements.map(t=>t.toFixed(4))} )`;switch(ct.getTransfer(e)){case ls:return[n,"LinearTransferOETF"];case tt:return[n,"sRGBTransferOETF"];default:return qe("WebGLProgram: Unsupported color space: ",e),[n,"LinearTransferOETF"]}}function xu(e,n,t){let r=e.getShaderParameter(n,e.COMPILE_STATUS),i=(e.getShaderInfoLog(n)||"").trim();if(r&&i==="")return"";let a=/ERROR: 0:(\d+)/.exec(i);if(a){let s=parseInt(a[1]);return t.toUpperCase()+`

`+i+`

`+V_(e.getShaderSource(n),s)}else return i}function W_(e,n){let t=z_(n);return[`vec4 ${e}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var X_={[_a]:"Linear",[va]:"Reinhard",[Sa]:"Cineon",[xa]:"ACESFilmic",[Ma]:"AgX",[Ta]:"Neutral",[Ea]:"Custom"};function $_(e,n){let t=X_[n];return t===void 0?(qe("WebGLProgram: Unsupported toneMapping:",n),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+e+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var pi=new te;function K_(){ct.getLuminanceCoefficients(pi);let e=pi.x.toFixed(4),n=pi.y.toFixed(4),t=pi.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${n}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Y_(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(xo).join(`
`)}function q_(e){let n=[];for(let t in e){let r=e[t];r!==!1&&n.push("#define "+t+" "+r)}return n.join(`
`)}function Z_(e,n){let t={},r=e.getProgramParameter(n,e.ACTIVE_ATTRIBUTES);for(let o=0;o<r;o++){let i=e.getActiveAttrib(n,o),a=i.name,s=1;i.type===e.FLOAT_MAT2&&(s=2),i.type===e.FLOAT_MAT3&&(s=3),i.type===e.FLOAT_MAT4&&(s=4),t[a]={type:i.type,location:e.getAttribLocation(n,a),locationSize:s}}return t}function xo(e){return e!==""}function Eu(e,n){let t=n.numSpotLightShadows+n.numSpotLightMaps-n.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,n.numSunLights).replace(/NUM_DIR_LIGHTS/g,n.numDirLights).replace(/NUM_SPOT_LIGHTS/g,n.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,n.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,n.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,n.numPointLights).replace(/NUM_HEMI_LIGHTS/g,n.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,n.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,n.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,n.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,n.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,n.numPointLightShadows)}function Mu(e,n){return e.replace(/NUM_CLIPPING_PLANES/g,n.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,n.numClippingPlanes-n.numClipIntersection)}var j_=/^[ \t]*#include +<([\w\d./]+)>/gm;function Bs(e){return e.replace(j_,J_)}var Q_=new Map;function J_(e,n){let t=Ce[n];if(t===void 0){let r=Q_.get(n);if(r!==void 0)t=Ce[r],qe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',n,r);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+n+">")}return Bs(t)}var ev=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Tu(e){return e.replace(ev,tv)}function tv(e,n,t,r){let o="";for(let i=parseInt(n);i<parseInt(t);i++)o+=r.replace(/\[\s*i\s*\]/g,"[ "+i+" ]").replace(/UNROLLED_LOOP_INDEX/g,i);return o}function bu(e){let n=`precision ${e.precision} float;
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
#define LOW_PRECISION`),n}var nv={[so]:"SHADOWMAP_TYPE_PCF",[Rr]:"SHADOWMAP_TYPE_VSM"};function rv(e){return nv[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var ov={[Pr]:"ENVMAP_TYPE_CUBE",[Jn]:"ENVMAP_TYPE_CUBE",[co]:"ENVMAP_TYPE_CUBE_UV"};function iv(e){return e.envMap===!1?"ENVMAP_TYPE_CUBE":ov[e.envMapMode]||"ENVMAP_TYPE_CUBE"}var av={[Jn]:"ENVMAP_MODE_REFRACTION"};function sv(e){return e.envMap===!1?"ENVMAP_MODE_REFLECTION":av[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}var lv={[mf]:"ENVMAP_BLENDING_MULTIPLY",[gf]:"ENVMAP_BLENDING_MIX",[_f]:"ENVMAP_BLENDING_ADD"};function cv(e){return e.envMap===!1?"ENVMAP_BLENDING_NONE":lv[e.combine]||"ENVMAP_BLENDING_NONE"}function fv(e){let n=e.envMapCubeUVHeight;if(n===null)return null;let t=Math.log2(n)-2,r=1/n;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:r,maxMip:t}}function uv(e,n,t,r){let o=e.getContext(),i=t.defines,a=t.vertexShader,s=t.fragmentShader,l=rv(t),f=iv(t),c=sv(t),u=cv(t),d=fv(t),h=Y_(t),_=q_(i),T=o.createProgram(),p,m,v=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(xo).join(`
`),p.length>0&&(p+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(xo).join(`
`),m.length>0&&(m+=`
`)):(p=[bu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(xo).join(`
`),m=[bu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+f:"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==cn?"#define TONE_MAPPING":"",t.toneMapping!==cn?Ce.tonemapping_pars_fragment:"",t.toneMapping!==cn?$_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ce.colorspace_pars_fragment,W_("linearToOutputTexel",t.outputColorSpace),K_(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(xo).join(`
`)),a=Bs(a),a=Eu(a,t),a=Mu(a,t),s=Bs(s),s=Eu(s,t),s=Mu(s,t),a=Tu(a),s=Tu(s),t.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,p=[h,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,m=["#define varying in",t.glslVersion===fs?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===fs?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let x=v+p+a,g=v+m+s,M=vu(o,o.VERTEX_SHADER,x),b=vu(o,o.FRAGMENT_SHADER,g);o.attachShader(T,M),o.attachShader(T,b),t.index0AttributeName!==void 0?o.bindAttribLocation(T,0,t.index0AttributeName):t.hasPositionAttribute===!0&&o.bindAttribLocation(T,0,"position"),o.linkProgram(T);function A(P){if(e.debug.checkShaderErrors){let D=o.getProgramInfoLog(T)||"",U=o.getShaderInfoLog(M)||"",L=o.getShaderInfoLog(b)||"",H=D.trim(),z=U.trim(),F=L.trim(),X=!0,$=!0;if(o.getProgramParameter(T,o.LINK_STATUS)===!1)if(X=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(o,T,M,b);else{let j=xu(o,M,"vertex"),Z=xu(o,b,"fragment");it("WebGLProgram: Shader Error "+o.getError()+" - VALIDATE_STATUS "+o.getProgramParameter(T,o.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+H+`
`+j+`
`+Z)}else H!==""?qe("WebGLProgram: Program Info Log:",H):(z===""||F==="")&&($=!1);$&&(P.diagnostics={runnable:X,programLog:H,vertexShader:{log:z,prefix:p},fragmentShader:{log:F,prefix:m}})}o.deleteShader(M),o.deleteShader(b),S=new Fr(o,T),w=Z_(o,T)}let S;this.getUniforms=function(){return S===void 0&&A(this),S};let w;this.getAttributes=function(){return w===void 0&&A(this),w};let y=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return y===!1&&(y=o.getProgramParameter(T,G_)),y},this.destroy=function(){r.releaseStatesOfProgram(this),o.deleteProgram(T),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=k_++,this.cacheKey=n,this.usedTimes=1,this.program=T,this.vertexShader=M,this.fragmentShader=b,this}var dv=0,Gs=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(n,t,r){let o=this._getShaderCacheForMaterial(n);return o.has(t)===!1&&(o.add(t),t.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(n){let t=this.materialCache.get(n);for(let r of t)r.usedTimes--,r.usedTimes===0&&this.shaderCache.delete(r.code);return this.materialCache.delete(n),this}getVertexShaderStage(n){return this._getShaderStage(n.vertexShader)}getFragmentShaderStage(n){return this._getShaderStage(n.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(n){let t=this.materialCache,r=t.get(n);return r===void 0&&(r=new Set,t.set(n,r)),r}_getShaderStage(n){let t=this.shaderCache,r=t.get(n);return r===void 0&&(r=new ks(n),t.set(n,r)),r}},ks=class{constructor(n){this.id=dv++,this.code=n,this.usedTimes=0}};function hv(e){return e===nr||e===oi||e===ii}function pv(e,n,t,r,o,i){let a=new Vf,s=new Gs,l=new Set,f=[],c=new Map,u=r.logarithmicDepthBuffer,d=r.precision,h={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(S){return l.add(S),S===0?"uv":`uv${S}`}function T(S,w,y,P,D,U){let L=P.fog,H=D.geometry,z=S.isMeshStandardMaterial||S.isMeshLambertMaterial||S.isMeshPhongMaterial?P.environment:null,F=S.isMeshStandardMaterial||S.isMeshLambertMaterial&&!S.envMap||S.isMeshPhongMaterial&&!S.envMap,X=n.get(S.envMap||z,F),$=X&&X.mapping===co?X.image.height:null,j=h[S.type];S.precision!==null&&(d=r.getMaxPrecision(S.precision),d!==S.precision&&qe("WebGLProgram.getParameters:",S.precision,"not supported, using",d,"instead."));let Z=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,ge=Z!==void 0?Z.length:0,Ee=0;H.morphAttributes.position!==void 0&&(Ee=1),H.morphAttributes.normal!==void 0&&(Ee=2),H.morphAttributes.color!==void 0&&(Ee=3);let ze,$e,We,q;if(j){let rt=tn[j];ze=rt.vertexShader,$e=rt.fragmentShader}else{ze=S.vertexShader,$e=S.fragmentShader;let rt=s.getVertexShaderStage(S),Ke=s.getFragmentShaderStage(S);s.update(S,rt,Ke),We=rt.id,q=Ke.id}let J=e.getRenderTarget(),xe=e.state.buffers.depth.getReversed(),Ue=D.isInstancedMesh===!0,_e=D.isBatchedMesh===!0,Ge=!!S.map,Mt=!!S.matcap,Ie=!!X,Xe=!!S.aoMap,nt=!!S.lightMap,Fe=!!S.bumpMap&&S.wireframe===!1,lt=!!S.normalMap,Rt=!!S.displacementMap,Bt=!!S.emissiveMap,ut=!!S.metalnessMap,_t=!!S.roughnessMap,O=S.anisotropy>0,Ut=S.clearcoat>0,Ze=S.dispersion>0,C=S.retroreflectivity>0,E=S.iridescence>0,B=S.sheen>0,V=S.transmission>0,K=O&&!!S.anisotropyMap,re=Ut&&!!S.clearcoatMap,oe=Ut&&!!S.clearcoatNormalMap,Y=Ut&&!!S.clearcoatRoughnessMap,ee=E&&!!S.iridescenceMap,ie=E&&!!S.iridescenceThicknessMap,be=B&&!!S.sheenColorMap,fe=B&&!!S.sheenRoughnessMap,ae=!!S.specularMap,we=!!S.specularColorMap,Re=!!S.specularIntensityMap,Le=V&&!!S.transmissionMap,N=V&&!!S.thicknessMap,se=!!S.gradientMap,Q=!!S.alphaMap,le=S.alphaTest>0,he=!!S.alphaHash,ne=!!S.extensions,Ae=cn;S.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(Ae=e.toneMapping);let Me={shaderID:j,shaderType:S.type,shaderName:S.name,vertexShader:ze,fragmentShader:$e,defines:S.defines,customVertexShaderID:We,customFragmentShaderID:q,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:d,batching:_e,batchingColor:_e&&D._colorsTexture!==null,instancing:Ue,instancingColor:Ue&&D.instanceColor!==null,instancingMorph:Ue&&D.morphTexture!==null,outputColorSpace:J===null?e.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:ct.workingColorSpace,alphaToCoverage:!!S.alphaToCoverage,map:Ge,matcap:Mt,envMap:Ie,envMapMode:Ie&&X.mapping,envMapCubeUVHeight:$,aoMap:Xe,lightMap:nt,bumpMap:Fe,normalMap:lt,displacementMap:Rt,emissiveMap:Bt,normalMapObjectSpace:lt&&S.normalMapType===Af,normalMapTangentSpace:lt&&S.normalMapType===as,packedNormalMap:lt&&S.normalMapType===as&&hv(S.normalMap.format),metalnessMap:ut,roughnessMap:_t,anisotropy:O,anisotropyMap:K,clearcoat:Ut,clearcoatMap:re,clearcoatNormalMap:oe,clearcoatRoughnessMap:Y,dispersion:Ze,retroreflection:C,iridescence:E,iridescenceMap:ee,iridescenceThicknessMap:ie,sheen:B,sheenColorMap:be,sheenRoughnessMap:fe,specularMap:ae,specularColorMap:we,specularIntensityMap:Re,transmission:V,transmissionMap:Le,thicknessMap:N,gradientMap:se,opaque:S.transparent===!1&&S.blending===lo&&S.alphaToCoverage===!1,alphaMap:Q,alphaTest:le,alphaHash:he,combine:S.combine,mapUv:Ge&&_(S.map.channel),aoMapUv:Xe&&_(S.aoMap.channel),lightMapUv:nt&&_(S.lightMap.channel),bumpMapUv:Fe&&_(S.bumpMap.channel),normalMapUv:lt&&_(S.normalMap.channel),displacementMapUv:Rt&&_(S.displacementMap.channel),emissiveMapUv:Bt&&_(S.emissiveMap.channel),metalnessMapUv:ut&&_(S.metalnessMap.channel),roughnessMapUv:_t&&_(S.roughnessMap.channel),anisotropyMapUv:K&&_(S.anisotropyMap.channel),clearcoatMapUv:re&&_(S.clearcoatMap.channel),clearcoatNormalMapUv:oe&&_(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Y&&_(S.clearcoatRoughnessMap.channel),iridescenceMapUv:ee&&_(S.iridescenceMap.channel),iridescenceThicknessMapUv:ie&&_(S.iridescenceThicknessMap.channel),sheenColorMapUv:be&&_(S.sheenColorMap.channel),sheenRoughnessMapUv:fe&&_(S.sheenRoughnessMap.channel),specularMapUv:ae&&_(S.specularMap.channel),specularColorMapUv:we&&_(S.specularColorMap.channel),specularIntensityMapUv:Re&&_(S.specularIntensityMap.channel),transmissionMapUv:Le&&_(S.transmissionMap.channel),thicknessMapUv:N&&_(S.thicknessMap.channel),alphaMapUv:Q&&_(S.alphaMap.channel),vertexTangents:!!H.attributes.tangent&&(lt||O),vertexNormals:!!H.attributes.normal,vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,pointsUvs:D.isPoints===!0&&!!H.attributes.uv&&(Ge||Q),fog:!!L,useFog:S.fog===!0,fogExp2:!!L&&L.isFogExp2,flatShading:S.wireframe===!1&&(S.flatShading===!0||H.attributes.normal===void 0&&lt===!1&&(S.isMeshLambertMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isMeshPhysicalMaterial)),sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:xe,skinning:D.isSkinnedMesh===!0,hasPositionAttribute:H.attributes.position!==void 0,morphTargets:H.morphAttributes.position!==void 0,morphNormals:H.morphAttributes.normal!==void 0,morphColors:H.morphAttributes.color!==void 0,morphTargetsCount:ge,morphTextureStride:Ee,numSunLights:w.sun.length,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numSunLightShadows:w.sunShadowMap.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numLightProbeGrids:U.length,numClippingPlanes:i.numPlanes,numClipIntersection:i.numIntersection,dithering:S.dithering,shadowMapEnabled:e.shadowMap.enabled&&y.length>0,shadowMapType:e.shadowMap.type,toneMapping:Ae,decodeVideoTexture:Ge&&S.map.isVideoTexture===!0&&ct.getTransfer(S.map.colorSpace)===tt,decodeVideoTextureEmissive:Bt&&S.emissiveMap.isVideoTexture===!0&&ct.getTransfer(S.emissiveMap.colorSpace)===tt,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===jt,flipSided:S.side===kt,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionClipCullDistance:ne&&S.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ne&&S.extensions.multiDraw===!0||_e)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()};return Me.vertexUv1s=l.has(1),Me.vertexUv2s=l.has(2),Me.vertexUv3s=l.has(3),l.clear(),Me}function p(S){let w=[];if(S.shaderID?w.push(S.shaderID):(w.push(S.customVertexShaderID),w.push(S.customFragmentShaderID)),S.defines!==void 0)for(let y in S.defines)w.push(y),w.push(S.defines[y]);return S.isRawShaderMaterial===!1&&(m(w,S),v(w,S),w.push(e.outputColorSpace)),w.push(S.customProgramCacheKey),w.join()}function m(S,w){S.push(w.precision),S.push(w.outputColorSpace),S.push(w.envMapMode),S.push(w.envMapCubeUVHeight),S.push(w.mapUv),S.push(w.alphaMapUv),S.push(w.lightMapUv),S.push(w.aoMapUv),S.push(w.bumpMapUv),S.push(w.normalMapUv),S.push(w.displacementMapUv),S.push(w.emissiveMapUv),S.push(w.metalnessMapUv),S.push(w.roughnessMapUv),S.push(w.anisotropyMapUv),S.push(w.clearcoatMapUv),S.push(w.clearcoatNormalMapUv),S.push(w.clearcoatRoughnessMapUv),S.push(w.iridescenceMapUv),S.push(w.iridescenceThicknessMapUv),S.push(w.sheenColorMapUv),S.push(w.sheenRoughnessMapUv),S.push(w.specularMapUv),S.push(w.specularColorMapUv),S.push(w.specularIntensityMapUv),S.push(w.transmissionMapUv),S.push(w.thicknessMapUv),S.push(w.combine),S.push(w.fogExp2),S.push(w.sizeAttenuation),S.push(w.morphTargetsCount),S.push(w.morphAttributeCount),S.push(w.numSunLights),S.push(w.numDirLights),S.push(w.numPointLights),S.push(w.numSpotLights),S.push(w.numSpotLightMaps),S.push(w.numHemiLights),S.push(w.numRectAreaLights),S.push(w.numSunLightShadows),S.push(w.numDirLightShadows),S.push(w.numPointLightShadows),S.push(w.numSpotLightShadows),S.push(w.numSpotLightShadowsWithMaps),S.push(w.numLightProbes),S.push(w.shadowMapType),S.push(w.toneMapping),S.push(w.numClippingPlanes),S.push(w.numClipIntersection),S.push(w.depthPacking)}function v(S,w){a.disableAll(),w.instancing&&a.enable(0),w.instancingColor&&a.enable(1),w.instancingMorph&&a.enable(2),w.matcap&&a.enable(3),w.envMap&&a.enable(4),w.normalMapObjectSpace&&a.enable(5),w.normalMapTangentSpace&&a.enable(6),w.clearcoat&&a.enable(7),w.iridescence&&a.enable(8),w.alphaTest&&a.enable(9),w.vertexColors&&a.enable(10),w.vertexAlphas&&a.enable(11),w.vertexUv1s&&a.enable(12),w.vertexUv2s&&a.enable(13),w.vertexUv3s&&a.enable(14),w.vertexTangents&&a.enable(15),w.anisotropy&&a.enable(16),w.alphaHash&&a.enable(17),w.batching&&a.enable(18),w.dispersion&&a.enable(19),w.retroreflection&&a.enable(24),w.batchingColor&&a.enable(20),w.gradientMap&&a.enable(21),w.packedNormalMap&&a.enable(22),w.vertexNormals&&a.enable(23),S.push(a.mask),a.disableAll(),w.fog&&a.enable(0),w.useFog&&a.enable(1),w.flatShading&&a.enable(2),w.logarithmicDepthBuffer&&a.enable(3),w.reversedDepthBuffer&&a.enable(4),w.skinning&&a.enable(5),w.morphTargets&&a.enable(6),w.morphNormals&&a.enable(7),w.morphColors&&a.enable(8),w.premultipliedAlpha&&a.enable(9),w.shadowMapEnabled&&a.enable(10),w.doubleSided&&a.enable(11),w.flipSided&&a.enable(12),w.useDepthPacking&&a.enable(13),w.dithering&&a.enable(14),w.transmission&&a.enable(15),w.sheen&&a.enable(16),w.opaque&&a.enable(17),w.pointsUvs&&a.enable(18),w.decodeVideoTexture&&a.enable(19),w.decodeVideoTextureEmissive&&a.enable(20),w.alphaToCoverage&&a.enable(21),w.numLightProbeGrids>0&&a.enable(22),w.hasPositionAttribute&&a.enable(23),S.push(a.mask)}function x(S){let w=h[S.type],y;if(w){let P=tn[w];y=Yf.clone(P.uniforms)}else y=S.uniforms;return y}function g(S,w){let y=c.get(w);return y!==void 0?++y.usedTimes:(y=new uv(e,w,S,o),f.push(y),c.set(w,y)),y}function M(S){if(--S.usedTimes===0){let w=f.indexOf(S);f[w]=f[f.length-1],f.pop(),c.delete(S.cacheKey),S.destroy()}}function b(S){s.remove(S)}function A(){s.dispose()}return{getParameters:T,getProgramCacheKey:p,getUniforms:x,acquireProgram:g,releaseProgram:M,releaseShaderCache:b,programs:f,dispose:A}}function mv(){let e=new WeakMap;function n(a){return e.has(a)}function t(a){let s=e.get(a);return s===void 0&&(s={},e.set(a,s)),s}function r(a){e.delete(a)}function o(a,s,l){e.get(a)[s]=l}function i(){e=new WeakMap}return{has:n,get:t,remove:r,update:o,dispose:i}}function gv(e,n){return e.groupOrder!==n.groupOrder?e.groupOrder-n.groupOrder:e.renderOrder!==n.renderOrder?e.renderOrder-n.renderOrder:e.material.id!==n.material.id?e.material.id-n.material.id:e.materialVariant!==n.materialVariant?e.materialVariant-n.materialVariant:e.z!==n.z?e.z-n.z:e.id-n.id}function wu(e,n){return e.groupOrder!==n.groupOrder?e.groupOrder-n.groupOrder:e.renderOrder!==n.renderOrder?e.renderOrder-n.renderOrder:e.z!==n.z?n.z-e.z:e.id-n.id}function Au(){let e=[],n=0,t=[],r=[],o=[];function i(){n=0,t.length=0,r.length=0,o.length=0}function a(d){let h=0;return d.isInstancedMesh&&(h+=2),d.isSkinnedMesh&&(h+=1),h}function s(d,h,_,T,p,m){let v=e[n];return v===void 0?(v={id:d.id,object:d,geometry:h,material:_,materialVariant:a(d),groupOrder:T,renderOrder:d.renderOrder,z:p,group:m},e[n]=v):(v.id=d.id,v.object=d,v.geometry=h,v.material=_,v.materialVariant=a(d),v.groupOrder=T,v.renderOrder=d.renderOrder,v.z=p,v.group=m),n++,v}function l(d,h,_,T,p,m,v){v.reversedDepth===!0&&(p=-p);let x=s(d,h,_,T,p,m);_.transmission>0?r.push(x):_.transparent===!0?o.push(x):t.push(x)}function f(d,h,_,T,p,m){let v=s(d,h,_,T,p,m);_.transmission>0?r.unshift(v):_.transparent===!0?o.unshift(v):t.unshift(v)}function c(d,h){t.length>1&&t.sort(d||gv),r.length>1&&r.sort(h||wu),o.length>1&&o.sort(h||wu)}function u(){for(let d=n,h=e.length;d<h;d++){let _=e[d];if(_.id===null)break;_.id=null,_.object=null,_.geometry=null,_.material=null,_.group=null}}return{opaque:t,transmissive:r,transparent:o,init:i,push:l,unshift:f,finish:u,sort:c}}function _v(){let e=new WeakMap;function n(r,o){let i=e.get(r),a;return i===void 0?(a=new Au,e.set(r,[a])):o>=i.length?(a=new Au,i.push(a)):a=i[o],a}function t(){e=new WeakMap}return{get:n,dispose:t}}function vv(){let e={};return{get:function(n){if(e[n.id]!==void 0)return e[n.id];let t;switch(n.type){case"SunLight":case"DirectionalLight":t={direction:new te,color:new ye};break;case"SpotLight":t={position:new te,direction:new te,color:new ye,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new te,color:new ye,distance:0,decay:0};break;case"HemisphereLight":t={direction:new te,skyColor:new ye,groundColor:new ye};break;case"RectAreaLight":t={color:new ye,position:new te,halfWidth:new te,halfHeight:new te};break}return e[n.id]=t,t}}}function Sv(){let e={};return{get:function(n){if(e[n.id]!==void 0)return e[n.id];let t;switch(n.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new je,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[n.id]=t,t}}}var xv=0;function Ev(e,n){return(n.castShadow?2:0)-(e.castShadow?2:0)+(n.map?1:0)-(e.map?1:0)}function Mv(e){let n=new vv,t=Sv(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let f=0;f<9;f++)r.probe.push(new te);let o=new te,i=new Yt,a=new Yt;function s(f){let c=0,u=0,d=0;for(let D=0;D<9;D++)r.probe[D].set(0,0,0);let h=0,_=0,T=0,p=0,m=0,v=0,x=0,g=0,M=0,b=0,A=0,S=0,w=0,y=0;f.sort(Ev);for(let D=0,U=f.length;D<U;D++){let L=f[D],H=L.color,z=L.intensity,F=L.distance,X=null;if(L.shadow&&L.shadow.map&&(L.shadow.map.texture.format===nr?X=L.shadow.map.texture:X=L.shadow.map.depthTexture||L.shadow.map.texture),L.isAmbientLight)c+=H.r*z,u+=H.g*z,d+=H.b*z;else if(L.isLightProbe){for(let $=0;$<9;$++)r.probe[$].addScaledVector(L.sh.coefficients[$],z);y++}else if(L.isSunLight){let $=n.get(L);if($.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let j=L.shadow,Z=t.get(L);Z.shadowIntensity=j.intensity,Z.shadowBias=j.bias,Z.shadowNormalBias=j.normalBias,Z.shadowRadius=j.radius,Z.shadowMapSize.copy(j.mapSize).multiply(j.getFrameExtents()),r.sunShadow[_]=Z,r.sunShadowMap[_]=X;let ge=j.getViewportCount();for(let Ee=0;Ee<ge;Ee++)r.sunShadowMatrix[T+Ee]=j.getMatrix(Ee),r.sunShadowCascade[T+Ee]=j._cascadeData[Ee];T+=ge,_++}r.sun[h]=$,h++}else if(L.isDirectionalLight){let $=n.get(L);if($.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let j=L.shadow,Z=t.get(L);Z.shadowIntensity=j.intensity,Z.shadowBias=j.bias,Z.shadowNormalBias=j.normalBias,Z.shadowRadius=j.radius,Z.shadowMapSize=j.mapSize,r.directionalShadow[p]=Z,r.directionalShadowMap[p]=X,r.directionalShadowMatrix[p]=L.shadow.matrix,M++}r.directional[p]=$,p++}else if(L.isSpotLight){let $=n.get(L);$.position.setFromMatrixPosition(L.matrixWorld),$.color.copy(H).multiplyScalar(z),$.distance=F,$.coneCos=Math.cos(L.angle),$.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),$.decay=L.decay,r.spot[v]=$;let j=L.shadow;if(L.map&&(r.spotLightMap[S]=L.map,S++,j.updateMatrices(L),L.castShadow&&w++),r.spotLightMatrix[v]=j.matrix,L.castShadow){let Z=t.get(L);Z.shadowIntensity=j.intensity,Z.shadowBias=j.bias,Z.shadowNormalBias=j.normalBias,Z.shadowRadius=j.radius,Z.shadowMapSize=j.mapSize,r.spotShadow[v]=Z,r.spotShadowMap[v]=X,A++}v++}else if(L.isRectAreaLight){let $=n.get(L);$.color.copy(H).multiplyScalar(z),$.halfWidth.set(L.width*.5,0,0),$.halfHeight.set(0,L.height*.5,0),r.rectArea[x]=$,x++}else if(L.isPointLight){let $=n.get(L);if($.color.copy(L.color).multiplyScalar(L.intensity),$.distance=L.distance,$.decay=L.decay,L.castShadow){let j=L.shadow,Z=t.get(L);Z.shadowIntensity=j.intensity,Z.shadowBias=j.bias,Z.shadowNormalBias=j.normalBias,Z.shadowRadius=j.radius,Z.shadowMapSize=j.mapSize,Z.shadowCameraNear=j.camera.near,Z.shadowCameraFar=j.camera.far,r.pointShadow[m]=Z,r.pointShadowMap[m]=X,r.pointShadowMatrix[m]=L.shadow.matrix,b++}r.point[m]=$,m++}else if(L.isHemisphereLight){let $=n.get(L);$.skyColor.copy(L.color).multiplyScalar(z),$.groundColor.copy(L.groundColor).multiplyScalar(z),r.hemi[g]=$,g++}}x>0&&(e.has("OES_texture_float_linear")===!0?(r.rectAreaLTC1=ce.LTC_FLOAT_1,r.rectAreaLTC2=ce.LTC_FLOAT_2):(r.rectAreaLTC1=ce.LTC_HALF_1,r.rectAreaLTC2=ce.LTC_HALF_2)),r.ambient[0]=c,r.ambient[1]=u,r.ambient[2]=d;let P=r.hash;(P.sunLength!==h||P.directionalLength!==p||P.pointLength!==m||P.spotLength!==v||P.rectAreaLength!==x||P.hemiLength!==g||P.numSunShadows!==_||P.numDirectionalShadows!==M||P.numPointShadows!==b||P.numSpotShadows!==A||P.numSpotMaps!==S||P.numLightProbes!==y)&&(r.sun.length=h,r.directional.length=p,r.spot.length=v,r.rectArea.length=x,r.point.length=m,r.hemi.length=g,r.sunShadow.length=_,r.sunShadowMap.length=_,r.sunShadowMatrix.length=T,r.sunShadowCascade.length=T,r.directionalShadow.length=M,r.directionalShadowMap.length=M,r.directionalShadowMatrix.length=M,r.pointShadow.length=b,r.pointShadowMap.length=b,r.pointShadowMatrix.length=b,r.spotShadow.length=A,r.spotShadowMap.length=A,r.spotLightMatrix.length=A+S-w,r.spotLightMap.length=S,r.numSpotLightShadowsWithMaps=w,r.numLightProbes=y,P.sunLength=h,P.directionalLength=p,P.pointLength=m,P.spotLength=v,P.rectAreaLength=x,P.hemiLength=g,P.numSunShadows=_,P.numDirectionalShadows=M,P.numPointShadows=b,P.numSpotShadows=A,P.numSpotMaps=S,P.numLightProbes=y,r.version=xv++)}function l(f,c){let u=0,d=0,h=0,_=0,T=0,p=0,m=c.matrixWorldInverse;for(let v=0,x=f.length;v<x;v++){let g=f[v];if(g.isSunLight){let M=r.sun[u];M.direction.setFromMatrixPosition(g.matrixWorld),M.direction.transformDirection(m),u++}else if(g.isDirectionalLight){let M=r.directional[d];M.direction.setFromMatrixPosition(g.matrixWorld),o.setFromMatrixPosition(g.target.matrixWorld),M.direction.sub(o),M.direction.transformDirection(m),d++}else if(g.isSpotLight){let M=r.spot[_];M.position.setFromMatrixPosition(g.matrixWorld),M.position.applyMatrix4(m),M.direction.setFromMatrixPosition(g.matrixWorld),o.setFromMatrixPosition(g.target.matrixWorld),M.direction.sub(o),M.direction.transformDirection(m),_++}else if(g.isRectAreaLight){let M=r.rectArea[T];M.position.setFromMatrixPosition(g.matrixWorld),M.position.applyMatrix4(m),a.identity(),i.copy(g.matrixWorld),i.premultiply(m),a.extractRotation(i),M.halfWidth.set(g.width*.5,0,0),M.halfHeight.set(0,g.height*.5,0),M.halfWidth.applyMatrix4(a),M.halfHeight.applyMatrix4(a),T++}else if(g.isPointLight){let M=r.point[h];M.position.setFromMatrixPosition(g.matrixWorld),M.position.applyMatrix4(m),h++}else if(g.isHemisphereLight){let M=r.hemi[p];M.direction.setFromMatrixPosition(g.matrixWorld),M.direction.transformDirection(m),p++}}}return{setup:s,setupView:l,state:r}}function Ru(e){let n=new Mv(e),t=[],r=[],o=[];function i(d){u.camera=d,t.length=0,r.length=0,o.length=0}function a(d){t.push(d)}function s(d){r.push(d)}function l(d){o.push(d)}function f(){n.setup(t)}function c(d){n.setupView(t,d)}let u={lightsArray:t,shadowsArray:r,lightProbeGridArray:o,camera:null,lights:n,transmissionRenderTarget:{},textureUnits:0};return{init:i,state:u,setupLights:f,setupLightsView:c,pushLight:a,pushShadow:s,pushLightProbeGrid:l}}function Tv(e){let n=new WeakMap;function t(o,i=0){let a=n.get(o),s;return a===void 0?(s=new Ru(e),n.set(o,[s])):i>=a.length?(s=new Ru(e),a.push(s)):s=a[i],s}function r(){n=new WeakMap}return{get:t,dispose:r}}var bv=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,wv=`uniform sampler2D shadow_pass;
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
}`,Av=[new te(1,0,0),new te(-1,0,0),new te(0,1,0),new te(0,-1,0),new te(0,0,1),new te(0,0,-1)],Rv=[new te(0,-1,0),new te(0,-1,0),new te(0,0,1),new te(0,0,-1),new te(0,-1,0),new te(0,-1,0)],yu=new Yt,So=new te,Is=new te;function yv(e,n,t){let r=new gs,o=new je,i=new je,a=new Pt,s=new Zf,l=new jf,f={},c=t.maxTextureSize,u={[yr]:kt,[kt]:yr,[jt]:jt},d=new en({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new je},radius:{value:4}},vertexShader:bv,fragmentShader:wv}),h=d.clone();h.defines.HORIZONTAL_PASS=1;let _=new xt;_.setAttribute("position",new Oe(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let T=new yt(_,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=so;let m=this.type;this.render=function(b,A,S){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||b.length===0)return;this.type===Gc&&(qe("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=so);let w=e.getRenderTarget(),y=e.getActiveCubeFace(),P=e.getActiveMipmapLevel(),D=e.state;D.setBlending(Sn),D.buffers.depth.getReversed()===!0?D.buffers.color.setClear(0,0,0,0):D.buffers.color.setClear(1,1,1,1),D.buffers.depth.setTest(!0),D.setScissorTest(!1);let U=m!==this.type;U&&A.traverse(function(L){L.material&&(Array.isArray(L.material)?L.material.forEach(H=>H.needsUpdate=!0):L.material.needsUpdate=!0)});for(let L=0,H=b.length;L<H;L++){let z=b[L],F=z.shadow;if(F===void 0){qe("WebGLShadowMap:",z,"has no shadow.");continue}if(F.autoUpdate===!1&&F.needsUpdate===!1)continue;o.copy(F.mapSize);let X=F.getFrameExtents();o.multiply(X),i.copy(F.mapSize),(o.x>c||o.y>c)&&(o.x>c&&(i.x=Math.floor(c/X.x),o.x=i.x*X.x,F.mapSize.x=i.x),o.y>c&&(i.y=Math.floor(c/X.y),o.y=i.y*X.y,F.mapSize.y=i.y));let $=e.state.buffers.depth.getReversed();if(F.camera._reversedDepth=$,F.map===null||U===!0){if(F.map!==null&&(F.map.depthTexture!==null&&(F.map.depthTexture.dispose(),F.map.depthTexture=null),F.map.dispose()),this.type===Rr){if(z.isPointLight){qe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}F.map=new Jt(o.x,o.y,{format:nr,type:xn,minFilter:St,magFilter:St,generateMipmaps:!1}),F.map.texture.name=z.name+".shadowMap",F.map.depthTexture=new po(o.x,o.y,Cn),F.map.depthTexture.name=z.name+".shadowMapDepth",F.map.depthTexture.format=er,F.map.depthTexture.compareFunction=null,F.map.depthTexture.minFilter=Hn,F.map.depthTexture.magFilter=Hn}else z.isPointLight?(F.map=new gi(o.x),F.map.depthTexture=new Kf(o.x,Bn)):(F.map=new Jt(o.x,o.y),F.map.depthTexture=new po(o.x,o.y,Bn)),F.map.depthTexture.name=z.name+".shadowMap",F.map.depthTexture.format=er,this.type===so?(F.map.depthTexture.compareFunction=$?si:ai,F.map.depthTexture.minFilter=St,F.map.depthTexture.magFilter=St):(F.map.depthTexture.compareFunction=null,F.map.depthTexture.minFilter=Hn,F.map.depthTexture.magFilter=Hn);F.camera.updateProjectionMatrix()}F.map.isWebGLCubeRenderTarget!==!0&&(F.map.width!==o.x||F.map.height!==o.y)&&F.map.setSize(o.x,o.y);let j=F.map.isWebGLCubeRenderTarget?6:F.getViewportCount();z.isPointLight!==!0&&F.updateMatrices(z,S);for(let Z=0;Z<j;Z++){let ge=F.getCamera(Z);if(z.isPointLight){let Ee=F.camera,ze=F.matrix,$e=z.distance||Ee.far;$e!==Ee.far&&(Ee.far=$e,Ee.updateProjectionMatrix()),So.setFromMatrixPosition(z.matrixWorld),Ee.position.copy(So),Is.copy(Ee.position),Is.add(Av[Z]),Ee.up.copy(Rv[Z]),Ee.lookAt(Is),Ee.updateMatrixWorld(),ze.makeTranslation(-So.x,-So.y,-So.z),yu.multiplyMatrices(Ee.projectionMatrix,Ee.matrixWorldInverse),F._frustum.setFromProjectionMatrix(yu,Ee.coordinateSystem,Ee.reversedDepth)}if(F.map.isWebGLCubeRenderTarget)e.setRenderTarget(F.map,Z),e.clear();else{Z===0&&(e.setRenderTarget(F.map),e.clear());let Ee=F.getViewport(Z);a.set(i.x*Ee.x,i.y*Ee.y,i.x*Ee.z,i.y*Ee.w),D.viewport(a)}r=F.getFrustum(Z),g(A,S,ge,z,this.type)}F.isPointLightShadow!==!0&&this.type===Rr&&v(F,S),F.needsUpdate=!1}m=this.type,p.needsUpdate=!1,e.setRenderTarget(w,y,P)};function v(b,A){let S=n.update(T);d.defines.VSM_SAMPLES!==b.blurSamples&&(d.defines.VSM_SAMPLES=b.blurSamples,h.defines.VSM_SAMPLES=b.blurSamples,d.needsUpdate=!0,h.needsUpdate=!0),b.mapPass===null?b.mapPass=new Jt(o.x,o.y,{format:nr,type:xn}):(b.mapPass.width!==b.map.width||b.mapPass.height!==b.map.height)&&b.mapPass.setSize(b.map.width,b.map.height),d.uniforms.shadow_pass.value=b.map.depthTexture,d.uniforms.resolution.value.set(b.map.width,b.map.height),d.uniforms.radius.value=b.radius,e.setRenderTarget(b.mapPass),e.clear(),e.renderBufferDirect(A,null,S,d,T,null),h.uniforms.shadow_pass.value=b.mapPass.texture,h.uniforms.resolution.value.set(b.map.width,b.map.height),h.uniforms.radius.value=b.radius,e.setRenderTarget(b.map),e.clear(),e.renderBufferDirect(A,null,S,h,T,null)}function x(b,A,S,w){let y=null,P=S.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(P!==void 0)y=P;else if(y=S.isPointLight===!0?l:s,e.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){let D=y.uuid,U=A.uuid,L=f[D];L===void 0&&(L={},f[D]=L);let H=L[U];H===void 0&&(H=y.clone(),L[U]=H,A.addEventListener("dispose",M)),y=H}if(y.visible=A.visible,y.wireframe=A.wireframe,w===Rr?y.side=A.shadowSide!==null?A.shadowSide:A.side:y.side=A.shadowSide!==null?A.shadowSide:u[A.side],y.alphaMap=A.alphaMap,y.alphaTest=A.alphaToCoverage===!0?.5:A.alphaTest,y.map=A.map,y.clipShadows=A.clipShadows,y.clippingPlanes=A.clippingPlanes,y.clipIntersection=A.clipIntersection,y.displacementMap=A.displacementMap,y.displacementScale=A.displacementScale,y.displacementBias=A.displacementBias,y.wireframeLinewidth=A.wireframeLinewidth,y.linewidth=A.linewidth,S.isPointLight===!0&&y.isMeshDistanceMaterial===!0){let D=e.properties.get(y);D.light=S}return y}function g(b,A,S,w,y){if(b.visible===!1)return;if(b.layers.test(A.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&y===Rr)&&(!b.frustumCulled||b.intersectsFrustum(r))){b.modelViewMatrix.multiplyMatrices(S.matrixWorldInverse,b.matrixWorld);let U=n.update(b),L=b.material;if(Array.isArray(L)){let H=U.groups;for(let z=0,F=H.length;z<F;z++){let X=H[z],$=L[X.materialIndex];if($&&$.visible){let j=x(b,$,w,y);b.onBeforeShadow(e,b,A,S,U,j,X),e.renderBufferDirect(S,null,U,j,b,X),b.onAfterShadow(e,b,A,S,U,j,X)}}}else if(L.visible){let H=x(b,L,w,y);b.onBeforeShadow(e,b,A,S,U,H,null),e.renderBufferDirect(S,null,U,H,b,null),b.onAfterShadow(e,b,A,S,U,H,null)}}let D=b.children;for(let U=0,L=D.length;U<L;U++)g(D[U],A,S,w,y)}function M(b){b.target.removeEventListener("dispose",M);for(let S in f){let w=f[S],y=b.target.uuid;y in w&&(w[y].dispose(),delete w[y])}}}function Cv(e,n){function t(){let N=!1,se=new Pt,Q=null,le=new Pt(0,0,0,0);return{setMask:function(he){Q!==he&&!N&&(e.colorMask(he,he,he,he),Q=he)},setLocked:function(he){N=he},setClear:function(he,ne,Ae,Me,rt){rt===!0&&(he*=Me,ne*=Me,Ae*=Me),se.set(he,ne,Ae,Me),le.equals(se)===!1&&(e.clearColor(he,ne,Ae,Me),le.copy(se))},reset:function(){N=!1,Q=null,le.set(-1,0,0,0)}}}function r(){let N=!1,se=!1,Q=null,le=null,he=null;return{setReversed:function(ne){if(se!==ne){let Ae=n.get("EXT_clip_control");ne?Ae.clipControlEXT(Ae.LOWER_LEFT_EXT,Ae.ZERO_TO_ONE_EXT):Ae.clipControlEXT(Ae.LOWER_LEFT_EXT,Ae.NEGATIVE_ONE_TO_ONE_EXT),se=ne;let Me=he;he=null,this.setClear(Me)}},getReversed:function(){return se},setTest:function(ne){ne?J(e.DEPTH_TEST):xe(e.DEPTH_TEST)},setMask:function(ne){Q!==ne&&!N&&(e.depthMask(ne),Q=ne)},setFunc:function(ne){if(se&&(ne=Ff[ne]),le!==ne){switch(ne){case lf:e.depthFunc(e.NEVER);break;case cf:e.depthFunc(e.ALWAYS);break;case ff:e.depthFunc(e.LESS);break;case ga:e.depthFunc(e.LEQUAL);break;case uf:e.depthFunc(e.EQUAL);break;case df:e.depthFunc(e.GEQUAL);break;case hf:e.depthFunc(e.GREATER);break;case pf:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}le=ne}},setLocked:function(ne){N=ne},setClear:function(ne){he!==ne&&(he=ne,se&&(ne=1-ne),e.clearDepth(ne))},reset:function(){N=!1,Q=null,le=null,he=null,se=!1}}}function o(){let N=!1,se=null,Q=null,le=null,he=null,ne=null,Ae=null,Me=null,rt=null;return{setTest:function(Ke){N||(Ke?J(e.STENCIL_TEST):xe(e.STENCIL_TEST))},setMask:function(Ke){se!==Ke&&!N&&(e.stencilMask(Ke),se=Ke)},setFunc:function(Ke,ln,_n){(Q!==Ke||le!==ln||he!==_n)&&(e.stencilFunc(Ke,ln,_n),Q=Ke,le=ln,he=_n)},setOp:function(Ke,ln,_n){(ne!==Ke||Ae!==ln||Me!==_n)&&(e.stencilOp(Ke,ln,_n),ne=Ke,Ae=ln,Me=_n)},setLocked:function(Ke){N=Ke},setClear:function(Ke){rt!==Ke&&(e.clearStencil(Ke),rt=Ke)},reset:function(){N=!1,se=null,Q=null,le=null,he=null,ne=null,Ae=null,Me=null,rt=null}}}let i=new t,a=new r,s=new o,l=new WeakMap,f=new WeakMap,c={},u={},d={},h=new WeakMap,_=[],T=null,p=!1,m=null,v=null,x=null,g=null,M=null,b=null,A=null,S=new ye(0,0,0),w=0,y=!1,P=null,D=null,U=null,L=null,H=null,z=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),F=!1,X=0,$=e.getParameter(e.VERSION);$.indexOf("WebGL")!==-1?(X=parseFloat(/^WebGL (\d)/.exec($)[1]),F=X>=1):$.indexOf("OpenGL ES")!==-1&&(X=parseFloat(/^OpenGL ES (\d)/.exec($)[1]),F=X>=2);let j=null,Z={},ge=e.getParameter(e.SCISSOR_BOX),Ee=e.getParameter(e.VIEWPORT),ze=new Pt().fromArray(ge),$e=new Pt().fromArray(Ee);function We(N,se,Q,le){let he=new Uint8Array(4),ne=e.createTexture();e.bindTexture(N,ne),e.texParameteri(N,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(N,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let Ae=0;Ae<Q;Ae++)N===e.TEXTURE_3D||N===e.TEXTURE_2D_ARRAY?e.texImage3D(se,0,e.RGBA,1,1,le,0,e.RGBA,e.UNSIGNED_BYTE,he):e.texImage2D(se+Ae,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,he);return ne}let q={};q[e.TEXTURE_2D]=We(e.TEXTURE_2D,e.TEXTURE_2D,1),q[e.TEXTURE_CUBE_MAP]=We(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),q[e.TEXTURE_2D_ARRAY]=We(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),q[e.TEXTURE_3D]=We(e.TEXTURE_3D,e.TEXTURE_3D,1,1),i.setClear(0,0,0,1),a.setClear(1),s.setClear(0),J(e.DEPTH_TEST),a.setFunc(ga),Fe(!1),lt(da),J(e.CULL_FACE),Xe(Sn);function J(N){c[N]!==!0&&(e.enable(N),c[N]=!0)}function xe(N){c[N]!==!1&&(e.disable(N),c[N]=!1)}function Ue(N,se){return d[N]!==se?(e.bindFramebuffer(N,se),d[N]=se,N===e.DRAW_FRAMEBUFFER&&(d[e.FRAMEBUFFER]=se),N===e.FRAMEBUFFER&&(d[e.DRAW_FRAMEBUFFER]=se),!0):!1}function _e(N,se){let Q=_,le=!1;if(N){Q=h.get(se),Q===void 0&&(Q=[],h.set(se,Q));let he=N.textures;if(Q.length!==he.length||Q[0]!==e.COLOR_ATTACHMENT0){for(let ne=0,Ae=he.length;ne<Ae;ne++)Q[ne]=e.COLOR_ATTACHMENT0+ne;Q.length=he.length,le=!0}}else Q[0]!==e.BACK&&(Q[0]=e.BACK,le=!0);le&&e.drawBuffers(Q)}function Ge(N){return T!==N?(e.useProgram(N),T=N,!0):!1}let Mt={[Cr]:e.FUNC_ADD,[Vc]:e.FUNC_SUBTRACT,[zc]:e.FUNC_REVERSE_SUBTRACT};Mt[Wc]=e.MIN,Mt[Xc]=e.MAX;let Ie={[$c]:e.ZERO,[Kc]:e.ONE,[Yc]:e.SRC_COLOR,[Zc]:e.SRC_ALPHA,[nf]:e.SRC_ALPHA_SATURATE,[ef]:e.DST_COLOR,[Qc]:e.DST_ALPHA,[qc]:e.ONE_MINUS_SRC_COLOR,[jc]:e.ONE_MINUS_SRC_ALPHA,[tf]:e.ONE_MINUS_DST_COLOR,[Jc]:e.ONE_MINUS_DST_ALPHA,[rf]:e.CONSTANT_COLOR,[of]:e.ONE_MINUS_CONSTANT_COLOR,[af]:e.CONSTANT_ALPHA,[sf]:e.ONE_MINUS_CONSTANT_ALPHA};function Xe(N,se,Q,le,he,ne,Ae,Me,rt,Ke){if(N===Sn){p===!0&&(xe(e.BLEND),p=!1);return}if(p===!1&&(J(e.BLEND),p=!0),N!==kc){if(N!==m||Ke!==y){if((v!==Cr||M!==Cr)&&(e.blendEquation(e.FUNC_ADD),v=Cr,M=Cr),Ke)switch(N){case lo:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case ha:e.blendFunc(e.ONE,e.ONE);break;case pa:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case ma:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:it("WebGLState: Invalid blending: ",N);break}else switch(N){case lo:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case ha:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case pa:it("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case ma:it("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:it("WebGLState: Invalid blending: ",N);break}x=null,g=null,b=null,A=null,S.set(0,0,0),w=0,m=N,y=Ke}return}he=he||se,ne=ne||Q,Ae=Ae||le,(se!==v||he!==M)&&(e.blendEquationSeparate(Mt[se],Mt[he]),v=se,M=he),(Q!==x||le!==g||ne!==b||Ae!==A)&&(e.blendFuncSeparate(Ie[Q],Ie[le],Ie[ne],Ie[Ae]),x=Q,g=le,b=ne,A=Ae),(Me.equals(S)===!1||rt!==w)&&(e.blendColor(Me.r,Me.g,Me.b,rt),S.copy(Me),w=rt),m=N,y=!1}function nt(N,se){N.side===jt?xe(e.CULL_FACE):J(e.CULL_FACE);let Q=N.side===kt;se&&(Q=!Q),Fe(Q),N.blending===lo&&N.transparent===!1?Xe(Sn):Xe(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),a.setFunc(N.depthFunc),a.setTest(N.depthTest),a.setMask(N.depthWrite),i.setMask(N.colorWrite);let le=N.stencilWrite;s.setTest(le),le&&(s.setMask(N.stencilWriteMask),s.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),s.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),Bt(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?J(e.SAMPLE_ALPHA_TO_COVERAGE):xe(e.SAMPLE_ALPHA_TO_COVERAGE)}function Fe(N){P!==N&&(N?e.frontFace(e.CW):e.frontFace(e.CCW),P=N)}function lt(N){N!==Hc?(J(e.CULL_FACE),N!==D&&(N===da?e.cullFace(e.BACK):N===Bc?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):xe(e.CULL_FACE),D=N}function Rt(N){N!==U&&(F&&e.lineWidth(N),U=N)}function Bt(N,se,Q){N?(J(e.POLYGON_OFFSET_FILL),(L!==se||H!==Q)&&(L=se,H=Q,a.getReversed()&&(se=-se),e.polygonOffset(se,Q))):xe(e.POLYGON_OFFSET_FILL)}function ut(N){N?J(e.SCISSOR_TEST):xe(e.SCISSOR_TEST)}function _t(N){N===void 0&&(N=e.TEXTURE0+z-1),j!==N&&(e.activeTexture(N),j=N)}function O(N,se,Q){Q===void 0&&(j===null?Q=e.TEXTURE0+z-1:Q=j);let le=Z[Q];le===void 0&&(le={type:void 0,texture:void 0},Z[Q]=le),(le.type!==N||le.texture!==se)&&(j!==Q&&(e.activeTexture(Q),j=Q),e.bindTexture(N,se||q[N]),le.type=N,le.texture=se)}function Ut(){let N=Z[j];N!==void 0&&N.type!==void 0&&(e.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function Ze(){try{e.compressedTexImage2D(...arguments)}catch(N){it("WebGLState:",N)}}function C(){try{e.compressedTexImage3D(...arguments)}catch(N){it("WebGLState:",N)}}function E(){try{e.texSubImage2D(...arguments)}catch(N){it("WebGLState:",N)}}function B(){try{e.texSubImage3D(...arguments)}catch(N){it("WebGLState:",N)}}function V(){try{e.compressedTexSubImage2D(...arguments)}catch(N){it("WebGLState:",N)}}function K(){try{e.compressedTexSubImage3D(...arguments)}catch(N){it("WebGLState:",N)}}function re(){try{e.texStorage2D(...arguments)}catch(N){it("WebGLState:",N)}}function oe(){try{e.texStorage3D(...arguments)}catch(N){it("WebGLState:",N)}}function Y(){try{e.texImage2D(...arguments)}catch(N){it("WebGLState:",N)}}function ee(){try{e.texImage3D(...arguments)}catch(N){it("WebGLState:",N)}}function ie(N){return u[N]!==void 0?u[N]:e.getParameter(N)}function be(N,se){u[N]!==se&&(e.pixelStorei(N,se),u[N]=se)}function fe(N){ze.equals(N)===!1&&(e.scissor(N.x,N.y,N.z,N.w),ze.copy(N))}function ae(N){$e.equals(N)===!1&&(e.viewport(N.x,N.y,N.z,N.w),$e.copy(N))}function we(N,se){let Q=f.get(se);Q===void 0&&(Q=new WeakMap,f.set(se,Q));let le=Q.get(N);le===void 0&&(le=e.getUniformBlockIndex(se,N.name),Q.set(N,le))}function Re(N,se){let le=f.get(se).get(N);l.get(se)!==le&&(e.uniformBlockBinding(se,le,N.__bindingPointIndex),l.set(se,le))}function Le(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),a.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),c={},u={},j=null,Z={},d={},h=new WeakMap,_=[],T=null,p=!1,m=null,v=null,x=null,g=null,M=null,b=null,A=null,S=new ye(0,0,0),w=0,y=!1,P=null,D=null,U=null,L=null,H=null,ze.set(0,0,e.canvas.width,e.canvas.height),$e.set(0,0,e.canvas.width,e.canvas.height),i.reset(),a.reset(),s.reset()}return{buffers:{color:i,depth:a,stencil:s},enable:J,disable:xe,bindFramebuffer:Ue,drawBuffers:_e,useProgram:Ge,setBlending:Xe,setMaterial:nt,setFlipSided:Fe,setCullFace:lt,setLineWidth:Rt,setPolygonOffset:Bt,setScissorTest:ut,activeTexture:_t,bindTexture:O,unbindTexture:Ut,compressedTexImage2D:Ze,compressedTexImage3D:C,texImage2D:Y,texImage3D:ee,pixelStorei:be,getParameter:ie,updateUBOMapping:we,uniformBlockBinding:Re,texStorage2D:re,texStorage3D:oe,texSubImage2D:E,texSubImage3D:B,compressedTexSubImage2D:V,compressedTexSubImage3D:K,scissor:fe,viewport:ae,reset:Le}}function Pv(e,n,t,r,o,i,a){let s=n.has("WEBGL_multisampled_render_to_texture")?n.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),f=new je,c=new WeakMap,u=new Set,d,h=new WeakMap,_=!1;try{_=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function T(C,E){return _?new OffscreenCanvas(C,E):Uf("canvas")}function p(C,E,B){let V=1,K=Ze(C);if((K.width>B||K.height>B)&&(V=B/Math.max(K.width,K.height)),V<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){let re=Math.floor(V*K.width),oe=Math.floor(V*K.height);d===void 0&&(d=T(re,oe));let Y=E?T(re,oe):d;return Y.width=re,Y.height=oe,Y.getContext("2d").drawImage(C,0,0,re,oe),qe("WebGLRenderer: Texture has been resized from ("+K.width+"x"+K.height+") to ("+re+"x"+oe+")."),Y}else return"data"in C&&qe("WebGLRenderer: Image in DataTexture is too big ("+K.width+"x"+K.height+")."),C;return C}function m(C){return C.generateMipmaps}function v(C){e.generateMipmap(C)}function x(C){return C.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?e.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function g(C,E,B,V,K,re=!1){if(C!==null){if(e[C]!==void 0)return e[C];qe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let oe;V&&(oe=n.get("EXT_texture_norm16"),oe||qe("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let Y=E;if(E===e.RED&&(B===e.FLOAT&&(Y=e.R32F),B===e.HALF_FLOAT&&(Y=e.R16F),B===e.UNSIGNED_BYTE&&(Y=e.R8),B===e.UNSIGNED_SHORT&&oe&&(Y=oe.R16_EXT),B===e.SHORT&&oe&&(Y=oe.R16_SNORM_EXT)),E===e.RED_INTEGER&&(B===e.UNSIGNED_BYTE&&(Y=e.R8UI),B===e.UNSIGNED_SHORT&&(Y=e.R16UI),B===e.UNSIGNED_INT&&(Y=e.R32UI),B===e.BYTE&&(Y=e.R8I),B===e.SHORT&&(Y=e.R16I),B===e.INT&&(Y=e.R32I)),E===e.RG&&(B===e.FLOAT&&(Y=e.RG32F),B===e.HALF_FLOAT&&(Y=e.RG16F),B===e.UNSIGNED_BYTE&&(Y=e.RG8),B===e.UNSIGNED_SHORT&&oe&&(Y=oe.RG16_EXT),B===e.SHORT&&oe&&(Y=oe.RG16_SNORM_EXT)),E===e.RG_INTEGER&&(B===e.UNSIGNED_BYTE&&(Y=e.RG8UI),B===e.UNSIGNED_SHORT&&(Y=e.RG16UI),B===e.UNSIGNED_INT&&(Y=e.RG32UI),B===e.BYTE&&(Y=e.RG8I),B===e.SHORT&&(Y=e.RG16I),B===e.INT&&(Y=e.RG32I)),E===e.RGB_INTEGER&&(B===e.UNSIGNED_BYTE&&(Y=e.RGB8UI),B===e.UNSIGNED_SHORT&&(Y=e.RGB16UI),B===e.UNSIGNED_INT&&(Y=e.RGB32UI),B===e.BYTE&&(Y=e.RGB8I),B===e.SHORT&&(Y=e.RGB16I),B===e.INT&&(Y=e.RGB32I)),E===e.RGBA_INTEGER&&(B===e.UNSIGNED_BYTE&&(Y=e.RGBA8UI),B===e.UNSIGNED_SHORT&&(Y=e.RGBA16UI),B===e.UNSIGNED_INT&&(Y=e.RGBA32UI),B===e.BYTE&&(Y=e.RGBA8I),B===e.SHORT&&(Y=e.RGBA16I),B===e.INT&&(Y=e.RGBA32I)),E===e.RGB&&(B===e.UNSIGNED_SHORT&&oe&&(Y=oe.RGB16_EXT),B===e.SHORT&&oe&&(Y=oe.RGB16_SNORM_EXT),B===e.UNSIGNED_INT_5_9_9_9_REV&&(Y=e.RGB9_E5),B===e.UNSIGNED_INT_10F_11F_11F_REV&&(Y=e.R11F_G11F_B10F)),E===e.RGBA){let ee=re?ls:ct.getTransfer(K);B===e.FLOAT&&(Y=e.RGBA32F),B===e.HALF_FLOAT&&(Y=e.RGBA16F),B===e.UNSIGNED_BYTE&&(Y=ee===tt?e.SRGB8_ALPHA8:e.RGBA8),B===e.UNSIGNED_SHORT&&oe&&(Y=oe.RGBA16_EXT),B===e.SHORT&&oe&&(Y=oe.RGBA16_SNORM_EXT),B===e.UNSIGNED_SHORT_4_4_4_4&&(Y=e.RGBA4),B===e.UNSIGNED_SHORT_5_5_5_1&&(Y=e.RGB5_A1)}return(Y===e.R16F||Y===e.R32F||Y===e.RG16F||Y===e.RG32F||Y===e.RGBA16F||Y===e.RGBA32F)&&n.get("EXT_color_buffer_float"),Y}function M(C,E){let B;return C?E===null||E===Bn||E===Lr?B=e.DEPTH24_STENCIL8:E===Cn?B=e.DEPTH32F_STENCIL8:E===uo&&(B=e.DEPTH24_STENCIL8,qe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):E===null||E===Bn||E===Lr?B=e.DEPTH_COMPONENT24:E===Cn?B=e.DEPTH_COMPONENT32F:E===uo&&(B=e.DEPTH_COMPONENT16),B}function b(C,E){return m(C)===!0||C.isFramebufferTexture&&C.minFilter!==Hn&&C.minFilter!==St?Math.log2(Math.max(E.width,E.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?E.mipmaps.length:1}function A(C){let E=C.target;E.removeEventListener("dispose",A),w(E),E.isVideoTexture&&c.delete(E),E.isHTMLTexture&&u.delete(E)}function S(C){let E=C.target;E.removeEventListener("dispose",S),P(E)}function w(C){let E=r.get(C);if(E.__webglInit===void 0)return;let B=C.source,V=h.get(B);if(V){let K=V[E.__cacheKey];K.usedTimes--,K.usedTimes===0&&y(C),Object.keys(V).length===0&&h.delete(B)}r.remove(C)}function y(C){let E=r.get(C);e.deleteTexture(E.__webglTexture);let B=C.source,V=h.get(B);delete V[E.__cacheKey],a.memory.textures--}function P(C){let E=r.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),r.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let V=0;V<6;V++){if(Array.isArray(E.__webglFramebuffer[V]))for(let K=0;K<E.__webglFramebuffer[V].length;K++)e.deleteFramebuffer(E.__webglFramebuffer[V][K]);else e.deleteFramebuffer(E.__webglFramebuffer[V]);E.__webglDepthbuffer&&e.deleteRenderbuffer(E.__webglDepthbuffer[V])}else{if(Array.isArray(E.__webglFramebuffer))for(let V=0;V<E.__webglFramebuffer.length;V++)e.deleteFramebuffer(E.__webglFramebuffer[V]);else e.deleteFramebuffer(E.__webglFramebuffer);if(E.__webglDepthbuffer&&e.deleteRenderbuffer(E.__webglDepthbuffer),E.__webglMultisampledFramebuffer&&e.deleteFramebuffer(E.__webglMultisampledFramebuffer),E.__webglColorRenderbuffer)for(let V=0;V<E.__webglColorRenderbuffer.length;V++)E.__webglColorRenderbuffer[V]&&e.deleteRenderbuffer(E.__webglColorRenderbuffer[V]);E.__webglDepthRenderbuffer&&e.deleteRenderbuffer(E.__webglDepthRenderbuffer)}let B=C.textures;for(let V=0,K=B.length;V<K;V++){let re=r.get(B[V]);re.__webglTexture&&(e.deleteTexture(re.__webglTexture),a.memory.textures--),r.remove(B[V])}r.remove(C)}let D=0;function U(){D=0}function L(){return D}function H(C){D=C}function z(){let C=D;return C>=o.maxTextures&&qe("WebGLTextures: Trying to use "+(C+1)+" texture units while this GPU supports only "+o.maxTextures),D+=1,C}function F(C){let E=[];return E.push(C.wrapS),E.push(C.wrapT),E.push(C.wrapR||0),E.push(C.magFilter),E.push(C.minFilter),E.push(C.anisotropy),E.push(C.internalFormat),E.push(C.format),E.push(C.type),E.push(C.generateMipmaps),E.push(C.premultiplyAlpha),E.push(C.flipY),E.push(C.unpackAlignment),E.push(C.colorSpace),E.join()}function X(C,E){let B=r.get(C);if(C.isVideoTexture&&O(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&B.__version!==C.version){let V=C.image;if(V===null)qe("WebGLRenderer: Texture marked for update but no image data found.");else if(V.complete===!1)qe("WebGLRenderer: Texture marked for update but image is incomplete");else{xe(B,C,E);return}}else C.isExternalTexture&&(B.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(e.TEXTURE_2D,B.__webglTexture,e.TEXTURE0+E)}function $(C,E){let B=r.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&B.__version!==C.version){xe(B,C,E);return}else C.isExternalTexture&&(B.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(e.TEXTURE_2D_ARRAY,B.__webglTexture,e.TEXTURE0+E)}function j(C,E){let B=r.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&B.__version!==C.version){xe(B,C,E);return}t.bindTexture(e.TEXTURE_3D,B.__webglTexture,e.TEXTURE0+E)}function Z(C,E){let B=r.get(C);if(C.isCubeDepthTexture!==!0&&C.version>0&&B.__version!==C.version){Ue(B,C,E);return}t.bindTexture(e.TEXTURE_CUBE_MAP,B.__webglTexture,e.TEXTURE0+E)}let ge={[fn]:e.REPEAT,[jo]:e.CLAMP_TO_EDGE,[vf]:e.MIRRORED_REPEAT},Ee={[Hn]:e.NEAREST,[Sf]:e.NEAREST_MIPMAP_NEAREST,[fo]:e.NEAREST_MIPMAP_LINEAR,[St]:e.LINEAR,[Qo]:e.LINEAR_MIPMAP_NEAREST,[Xt]:e.LINEAR_MIPMAP_LINEAR},ze={[Rf]:e.NEVER,[Df]:e.ALWAYS,[yf]:e.LESS,[ai]:e.LEQUAL,[Cf]:e.EQUAL,[si]:e.GEQUAL,[Pf]:e.GREATER,[Lf]:e.NOTEQUAL};function $e(C,E){if(E.type===Cn&&n.has("OES_texture_float_linear")===!1&&(E.magFilter===St||E.magFilter===Qo||E.magFilter===fo||E.magFilter===Xt||E.minFilter===St||E.minFilter===Qo||E.minFilter===fo||E.minFilter===Xt)&&qe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(C,e.TEXTURE_WRAP_S,ge[E.wrapS]),e.texParameteri(C,e.TEXTURE_WRAP_T,ge[E.wrapT]),(C===e.TEXTURE_3D||C===e.TEXTURE_2D_ARRAY)&&e.texParameteri(C,e.TEXTURE_WRAP_R,ge[E.wrapR]),e.texParameteri(C,e.TEXTURE_MAG_FILTER,Ee[E.magFilter]),e.texParameteri(C,e.TEXTURE_MIN_FILTER,Ee[E.minFilter]),E.compareFunction&&(e.texParameteri(C,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(C,e.TEXTURE_COMPARE_FUNC,ze[E.compareFunction])),n.has("EXT_texture_filter_anisotropic")===!0){if(E.magFilter===Hn||E.minFilter!==fo&&E.minFilter!==Xt||E.type===Cn&&n.has("OES_texture_float_linear")===!1)return;if(E.anisotropy>1||r.get(E).__currentAnisotropy){let B=n.get("EXT_texture_filter_anisotropic");e.texParameterf(C,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(E.anisotropy,o.getMaxAnisotropy())),r.get(E).__currentAnisotropy=E.anisotropy}}}function We(C,E){let B=!1;C.__webglInit===void 0&&(C.__webglInit=!0,E.addEventListener("dispose",A));let V=E.source,K=h.get(V);K===void 0&&(K={},h.set(V,K));let re=F(E);if(re!==C.__cacheKey){K[re]===void 0&&(K[re]={texture:e.createTexture(),usedTimes:0},a.memory.textures++,B=!0),K[re].usedTimes++;let oe=K[C.__cacheKey];oe!==void 0&&(K[C.__cacheKey].usedTimes--,oe.usedTimes===0&&y(E)),C.__cacheKey=re,C.__webglTexture=K[re].texture}return B}function q(C,E,B){return Math.floor(Math.floor(C/B)/E)}function J(C,E,B,V){let re=C.updateRanges;if(re.length===0)t.texSubImage2D(e.TEXTURE_2D,0,0,0,E.width,E.height,B,V,E.data);else{re.sort((be,fe)=>be.start-fe.start);let oe=0;for(let be=1;be<re.length;be++){let fe=re[oe],ae=re[be],we=fe.start+fe.count,Re=q(ae.start,E.width,4),Le=q(fe.start,E.width,4);ae.start<=we+1&&Re===Le&&q(ae.start+ae.count-1,E.width,4)===Re?fe.count=Math.max(fe.count,ae.start+ae.count-fe.start):(++oe,re[oe]=ae)}re.length=oe+1;let Y=t.getParameter(e.UNPACK_ROW_LENGTH),ee=t.getParameter(e.UNPACK_SKIP_PIXELS),ie=t.getParameter(e.UNPACK_SKIP_ROWS);t.pixelStorei(e.UNPACK_ROW_LENGTH,E.width);for(let be=0,fe=re.length;be<fe;be++){let ae=re[be],we=Math.floor(ae.start/4),Re=Math.ceil(ae.count/4),Le=we%E.width,N=Math.floor(we/E.width),se=Re,Q=1;t.pixelStorei(e.UNPACK_SKIP_PIXELS,Le),t.pixelStorei(e.UNPACK_SKIP_ROWS,N),t.texSubImage2D(e.TEXTURE_2D,0,Le,N,se,Q,B,V,E.data)}C.clearUpdateRanges(),t.pixelStorei(e.UNPACK_ROW_LENGTH,Y),t.pixelStorei(e.UNPACK_SKIP_PIXELS,ee),t.pixelStorei(e.UNPACK_SKIP_ROWS,ie)}}function xe(C,E,B){let V=e.TEXTURE_2D;(E.isDataArrayTexture||E.isCompressedArrayTexture)&&(V=e.TEXTURE_2D_ARRAY),E.isData3DTexture&&(V=e.TEXTURE_3D);let K=We(C,E),re=E.source;t.bindTexture(V,C.__webglTexture,e.TEXTURE0+B);let oe=r.get(re);if(re.version!==oe.__version||K===!0){if(t.activeTexture(e.TEXTURE0+B),(typeof ImageBitmap<"u"&&E.image instanceof ImageBitmap)===!1){let Q=ct.getPrimaries(ct.workingColorSpace),le=E.colorSpace===un?null:ct.getPrimaries(E.colorSpace),he=E.colorSpace===un||Q===le?e.NONE:e.BROWSER_DEFAULT_WEBGL;t.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,E.flipY),t.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),t.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,he)}t.pixelStorei(e.UNPACK_ALIGNMENT,E.unpackAlignment);let ee=p(E.image,!1,o.maxTextureSize);ee=Ut(E,ee);let ie=i.convert(E.format,E.colorSpace),be=i.convert(E.type),fe=g(E.internalFormat,ie,be,E.normalized,E.colorSpace,E.isVideoTexture);$e(V,E);let ae,we=E.mipmaps,Re=E.isVideoTexture!==!0,Le=oe.__version===void 0||K===!0,N=re.dataReady,se=b(E,ee);if(E.isDepthTexture)fe=M(E.format===tr,E.type),Le&&(Re?t.texStorage2D(e.TEXTURE_2D,1,fe,ee.width,ee.height):t.texImage2D(e.TEXTURE_2D,0,fe,ee.width,ee.height,0,ie,be,null));else if(E.isDataTexture)if(we.length>0){Re&&Le&&t.texStorage2D(e.TEXTURE_2D,se,fe,we[0].width,we[0].height);for(let Q=0,le=we.length;Q<le;Q++)ae=we[Q],Re?N&&t.texSubImage2D(e.TEXTURE_2D,Q,0,0,ae.width,ae.height,ie,be,ae.data):t.texImage2D(e.TEXTURE_2D,Q,fe,ae.width,ae.height,0,ie,be,ae.data);E.generateMipmaps=!1}else Re?(Le&&t.texStorage2D(e.TEXTURE_2D,se,fe,ee.width,ee.height),N&&J(E,ee,ie,be)):t.texImage2D(e.TEXTURE_2D,0,fe,ee.width,ee.height,0,ie,be,ee.data);else if(E.isCompressedTexture)if(E.isCompressedArrayTexture){Re&&Le&&t.texStorage3D(e.TEXTURE_2D_ARRAY,se,fe,we[0].width,we[0].height,ee.depth);for(let Q=0,le=we.length;Q<le;Q++)if(ae=we[Q],E.format!==Qt)if(ie!==null)if(Re){if(N)if(E.layerUpdates.size>0){let he=bs(ae.width,ae.height,E.format,E.type);for(let ne of E.layerUpdates){let Ae=ae.data.subarray(ne*he/ae.data.BYTES_PER_ELEMENT,(ne+1)*he/ae.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Q,0,0,ne,ae.width,ae.height,1,ie,Ae)}}else t.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Q,0,0,0,ae.width,ae.height,ee.depth,ie,ae.data)}else t.compressedTexImage3D(e.TEXTURE_2D_ARRAY,Q,fe,ae.width,ae.height,ee.depth,0,ae.data,0,0);else qe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Re?N&&t.texSubImage3D(e.TEXTURE_2D_ARRAY,Q,0,0,0,ae.width,ae.height,ee.depth,ie,be,ae.data):t.texImage3D(e.TEXTURE_2D_ARRAY,Q,fe,ae.width,ae.height,ee.depth,0,ie,be,ae.data);E.layerUpdates.size>0&&E.clearLayerUpdates()}else{Re&&Le&&t.texStorage2D(e.TEXTURE_2D,se,fe,we[0].width,we[0].height);for(let Q=0,le=we.length;Q<le;Q++)ae=we[Q],E.format!==Qt?ie!==null?Re?N&&t.compressedTexSubImage2D(e.TEXTURE_2D,Q,0,0,ae.width,ae.height,ie,ae.data):t.compressedTexImage2D(e.TEXTURE_2D,Q,fe,ae.width,ae.height,0,ae.data):qe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Re?N&&t.texSubImage2D(e.TEXTURE_2D,Q,0,0,ae.width,ae.height,ie,be,ae.data):t.texImage2D(e.TEXTURE_2D,Q,fe,ae.width,ae.height,0,ie,be,ae.data)}else if(E.isDataArrayTexture)if(Re){if(Le&&t.texStorage3D(e.TEXTURE_2D_ARRAY,se,fe,ee.width,ee.height,ee.depth),N)if(E.layerUpdates.size>0){let Q=bs(ee.width,ee.height,E.format,E.type);for(let le of E.layerUpdates){let he=ee.data.subarray(le*Q/ee.data.BYTES_PER_ELEMENT,(le+1)*Q/ee.data.BYTES_PER_ELEMENT);t.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,le,ee.width,ee.height,1,ie,be,he)}E.clearLayerUpdates()}else t.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,ee.width,ee.height,ee.depth,ie,be,ee.data)}else t.texImage3D(e.TEXTURE_2D_ARRAY,0,fe,ee.width,ee.height,ee.depth,0,ie,be,ee.data);else if(E.isData3DTexture)Re?(Le&&t.texStorage3D(e.TEXTURE_3D,se,fe,ee.width,ee.height,ee.depth),N&&t.texSubImage3D(e.TEXTURE_3D,0,0,0,0,ee.width,ee.height,ee.depth,ie,be,ee.data)):t.texImage3D(e.TEXTURE_3D,0,fe,ee.width,ee.height,ee.depth,0,ie,be,ee.data);else if(E.isFramebufferTexture){if(Le)if(Re)t.texStorage2D(e.TEXTURE_2D,se,fe,ee.width,ee.height);else{let Q=ee.width,le=ee.height;for(let he=0;he<se;he++)t.texImage2D(e.TEXTURE_2D,he,fe,Q,le,0,ie,be,null),Q>>=1,le>>=1}}else if(E.isHTMLTexture){if("texElementImage2D"in e){let Q=e.canvas;if(Q.hasAttribute("layoutsubtree")||Q.setAttribute("layoutsubtree","true"),ee.parentNode!==Q){Q.appendChild(ee),u.add(E),Q.onpaint=le=>{let he=le.changedElements;for(let ne of u)he.includes(ne.image)&&(ne.needsUpdate=!0)},Q.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,ee);else{let he=e.RGBA,ne=e.RGBA,Ae=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,he,ne,Ae,ee)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(we.length>0){if(Re&&Le){let Q=Ze(we[0]);t.texStorage2D(e.TEXTURE_2D,se,fe,Q.width,Q.height)}for(let Q=0,le=we.length;Q<le;Q++)ae=we[Q],Re?N&&t.texSubImage2D(e.TEXTURE_2D,Q,0,0,ie,be,ae):t.texImage2D(e.TEXTURE_2D,Q,fe,ie,be,ae);E.generateMipmaps=!1}else if(Re){if(Le){let Q=Ze(ee);t.texStorage2D(e.TEXTURE_2D,se,fe,Q.width,Q.height)}N&&t.texSubImage2D(e.TEXTURE_2D,0,0,0,ie,be,ee)}else t.texImage2D(e.TEXTURE_2D,0,fe,ie,be,ee);m(E)&&v(V),oe.__version=re.version,E.onUpdate&&E.onUpdate(E)}C.__version=E.version}function Ue(C,E,B){if(E.image.length!==6)return;let V=We(C,E),K=E.source;t.bindTexture(e.TEXTURE_CUBE_MAP,C.__webglTexture,e.TEXTURE0+B);let re=r.get(K);if(K.version!==re.__version||V===!0){t.activeTexture(e.TEXTURE0+B);let oe=ct.getPrimaries(ct.workingColorSpace),Y=E.colorSpace===un?null:ct.getPrimaries(E.colorSpace),ee=E.colorSpace===un||oe===Y?e.NONE:e.BROWSER_DEFAULT_WEBGL;t.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,E.flipY),t.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),t.pixelStorei(e.UNPACK_ALIGNMENT,E.unpackAlignment),t.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,ee);let ie=E.isCompressedTexture||E.image[0].isCompressedTexture,be=E.image[0]&&E.image[0].isDataTexture,fe=[];for(let ne=0;ne<6;ne++)!ie&&!be?fe[ne]=p(E.image[ne],!0,o.maxCubemapSize):fe[ne]=be?E.image[ne].image:E.image[ne],fe[ne]=Ut(E,fe[ne]);let ae=fe[0],we=i.convert(E.format,E.colorSpace),Re=i.convert(E.type),Le=g(E.internalFormat,we,Re,E.normalized,E.colorSpace),N=E.isVideoTexture!==!0,se=re.__version===void 0||V===!0,Q=K.dataReady,le=b(E,ae);$e(e.TEXTURE_CUBE_MAP,E);let he;if(ie){N&&se&&t.texStorage2D(e.TEXTURE_CUBE_MAP,le,Le,ae.width,ae.height);for(let ne=0;ne<6;ne++){he=fe[ne].mipmaps;for(let Ae=0;Ae<he.length;Ae++){let Me=he[Ae];E.format!==Qt?we!==null?N?Q&&t.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae,0,0,Me.width,Me.height,we,Me.data):t.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae,Le,Me.width,Me.height,0,Me.data):qe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):N?Q&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae,0,0,Me.width,Me.height,we,Re,Me.data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae,Le,Me.width,Me.height,0,we,Re,Me.data)}}}else{if(he=E.mipmaps,N&&se){he.length>0&&le++;let ne=Ze(fe[0]);t.texStorage2D(e.TEXTURE_CUBE_MAP,le,Le,ne.width,ne.height)}for(let ne=0;ne<6;ne++)if(be){N?Q&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,fe[ne].width,fe[ne].height,we,Re,fe[ne].data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,Le,fe[ne].width,fe[ne].height,0,we,Re,fe[ne].data);for(let Ae=0;Ae<he.length;Ae++){let rt=he[Ae].image[ne].image;N?Q&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae+1,0,0,rt.width,rt.height,we,Re,rt.data):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae+1,Le,rt.width,rt.height,0,we,Re,rt.data)}}else{N?Q&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,0,0,we,Re,fe[ne]):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0,Le,we,Re,fe[ne]);for(let Ae=0;Ae<he.length;Ae++){let Me=he[Ae];N?Q&&t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae+1,0,0,we,Re,Me.image[ne]):t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ne,Ae+1,Le,we,Re,Me.image[ne])}}}m(E)&&v(e.TEXTURE_CUBE_MAP),re.__version=K.version,E.onUpdate&&E.onUpdate(E)}C.__version=E.version}function _e(C,E,B,V,K,re){let oe=i.convert(B.format,B.colorSpace),Y=i.convert(B.type),ee=g(B.internalFormat,oe,Y,B.normalized,B.colorSpace),ie=r.get(E),be=r.get(B);if(be.__renderTarget=E,!ie.__hasExternalTextures){let fe=Math.max(1,E.width>>re),ae=Math.max(1,E.height>>re);K===e.TEXTURE_3D||K===e.TEXTURE_2D_ARRAY?t.texImage3D(K,re,ee,fe,ae,E.depth,0,oe,Y,null):t.texImage2D(K,re,ee,fe,ae,0,oe,Y,null)}t.bindFramebuffer(e.FRAMEBUFFER,C),_t(E)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,V,K,be.__webglTexture,0,ut(E)):(K===e.TEXTURE_2D||K>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&K<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,V,K,be.__webglTexture,re),t.bindFramebuffer(e.FRAMEBUFFER,null)}function Ge(C,E,B){if(e.bindRenderbuffer(e.RENDERBUFFER,C),E.depthBuffer){let V=E.depthTexture,K=V&&V.isDepthTexture?V.type:null,re=M(E.stencilBuffer,K),oe=E.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;_t(E)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,ut(E),re,E.width,E.height):B?e.renderbufferStorageMultisample(e.RENDERBUFFER,ut(E),re,E.width,E.height):e.renderbufferStorage(e.RENDERBUFFER,re,E.width,E.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,oe,e.RENDERBUFFER,C)}else{let V=E.textures;for(let K=0;K<V.length;K++){let re=V[K],oe=i.convert(re.format,re.colorSpace),Y=i.convert(re.type),ee=g(re.internalFormat,oe,Y,re.normalized,re.colorSpace);_t(E)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,ut(E),ee,E.width,E.height):B?e.renderbufferStorageMultisample(e.RENDERBUFFER,ut(E),ee,E.width,E.height):e.renderbufferStorage(e.RENDERBUFFER,ee,E.width,E.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Mt(C,E,B){let V=E.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(e.FRAMEBUFFER,C),!(E.depthTexture&&E.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let K=r.get(E.depthTexture);if(K.__renderTarget=E,(!K.__webglTexture||E.depthTexture.image.width!==E.width||E.depthTexture.image.height!==E.height)&&(E.depthTexture.image.width=E.width,E.depthTexture.image.height=E.height,E.depthTexture.needsUpdate=!0),V){if(K.__webglInit===void 0&&(K.__webglInit=!0,E.depthTexture.addEventListener("dispose",A)),K.__webglTexture===void 0){K.__webglTexture=e.createTexture(),t.bindTexture(e.TEXTURE_CUBE_MAP,K.__webglTexture),$e(e.TEXTURE_CUBE_MAP,E.depthTexture);let ie=i.convert(E.depthTexture.format),be=i.convert(E.depthTexture.type),fe;E.depthTexture.format===er?fe=e.DEPTH_COMPONENT24:E.depthTexture.format===tr&&(fe=e.DEPTH24_STENCIL8);for(let ae=0;ae<6;ae++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,fe,E.width,E.height,0,ie,be,null)}}else X(E.depthTexture,0);let re=K.__webglTexture,oe=ut(E),Y=V?e.TEXTURE_CUBE_MAP_POSITIVE_X+B:e.TEXTURE_2D,ee=E.depthTexture.format===tr?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(E.depthTexture.format===er)_t(E)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,ee,Y,re,0,oe):e.framebufferTexture2D(e.FRAMEBUFFER,ee,Y,re,0);else if(E.depthTexture.format===tr)_t(E)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,ee,Y,re,0,oe):e.framebufferTexture2D(e.FRAMEBUFFER,ee,Y,re,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Ie(C){let E=r.get(C),B=C.isWebGLCubeRenderTarget===!0;if(E.__boundDepthTexture!==C.depthTexture){let V=C.depthTexture;if(E.__depthDisposeCallback&&E.__depthDisposeCallback(),V){let K=()=>{delete E.__boundDepthTexture,delete E.__depthDisposeCallback,V.removeEventListener("dispose",K)};V.addEventListener("dispose",K),E.__depthDisposeCallback=K}E.__boundDepthTexture=V}if(C.depthTexture&&!E.__autoAllocateDepthBuffer)if(B)for(let V=0;V<6;V++)Mt(E.__webglFramebuffer[V],C,V);else{let V=C.texture.mipmaps;V&&V.length>0?Mt(E.__webglFramebuffer[0],C,0):Mt(E.__webglFramebuffer,C,0)}else if(B){E.__webglDepthbuffer=[];for(let V=0;V<6;V++)if(t.bindFramebuffer(e.FRAMEBUFFER,E.__webglFramebuffer[V]),E.__webglDepthbuffer[V]===void 0)E.__webglDepthbuffer[V]=e.createRenderbuffer(),Ge(E.__webglDepthbuffer[V],C,!1);else{let K=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,re=E.__webglDepthbuffer[V];e.bindRenderbuffer(e.RENDERBUFFER,re),e.framebufferRenderbuffer(e.FRAMEBUFFER,K,e.RENDERBUFFER,re)}}else{let V=C.texture.mipmaps;if(V&&V.length>0?t.bindFramebuffer(e.FRAMEBUFFER,E.__webglFramebuffer[0]):t.bindFramebuffer(e.FRAMEBUFFER,E.__webglFramebuffer),E.__webglDepthbuffer===void 0)E.__webglDepthbuffer=e.createRenderbuffer(),Ge(E.__webglDepthbuffer,C,!1);else{let K=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,re=E.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,re),e.framebufferRenderbuffer(e.FRAMEBUFFER,K,e.RENDERBUFFER,re)}}t.bindFramebuffer(e.FRAMEBUFFER,null)}function Xe(C,E,B){let V=r.get(C);E!==void 0&&_e(V.__webglFramebuffer,C,C.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),B!==void 0&&Ie(C)}function nt(C){let E=C.texture,B=r.get(C),V=r.get(E);C.addEventListener("dispose",S);let K=C.textures,re=C.isWebGLCubeRenderTarget===!0,oe=K.length>1;if(oe||(V.__webglTexture===void 0&&(V.__webglTexture=e.createTexture()),V.__version=E.version,a.memory.textures++),re){B.__webglFramebuffer=[];for(let Y=0;Y<6;Y++)if(E.mipmaps&&E.mipmaps.length>0){B.__webglFramebuffer[Y]=[];for(let ee=0;ee<E.mipmaps.length;ee++)B.__webglFramebuffer[Y][ee]=e.createFramebuffer()}else B.__webglFramebuffer[Y]=e.createFramebuffer()}else{if(E.mipmaps&&E.mipmaps.length>0){B.__webglFramebuffer=[];for(let Y=0;Y<E.mipmaps.length;Y++)B.__webglFramebuffer[Y]=e.createFramebuffer()}else B.__webglFramebuffer=e.createFramebuffer();if(oe)for(let Y=0,ee=K.length;Y<ee;Y++){let ie=r.get(K[Y]);ie.__webglTexture===void 0&&(ie.__webglTexture=e.createTexture(),a.memory.textures++)}if(C.samples>0&&_t(C)===!1){B.__webglMultisampledFramebuffer=e.createFramebuffer(),B.__webglColorRenderbuffer=[],t.bindFramebuffer(e.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let Y=0;Y<K.length;Y++){let ee=K[Y];B.__webglColorRenderbuffer[Y]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,B.__webglColorRenderbuffer[Y]);let ie=i.convert(ee.format,ee.colorSpace),be=i.convert(ee.type),fe=g(ee.internalFormat,ie,be,ee.normalized,ee.colorSpace,C.isXRRenderTarget===!0),ae=ut(C);e.renderbufferStorageMultisample(e.RENDERBUFFER,ae,fe,C.width,C.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+Y,e.RENDERBUFFER,B.__webglColorRenderbuffer[Y])}e.bindRenderbuffer(e.RENDERBUFFER,null),C.depthBuffer&&(B.__webglDepthRenderbuffer=e.createRenderbuffer(),Ge(B.__webglDepthRenderbuffer,C,!0)),t.bindFramebuffer(e.FRAMEBUFFER,null)}}if(re){t.bindTexture(e.TEXTURE_CUBE_MAP,V.__webglTexture),$e(e.TEXTURE_CUBE_MAP,E);for(let Y=0;Y<6;Y++)if(E.mipmaps&&E.mipmaps.length>0)for(let ee=0;ee<E.mipmaps.length;ee++)_e(B.__webglFramebuffer[Y][ee],C,E,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+Y,ee);else _e(B.__webglFramebuffer[Y],C,E,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0);m(E)&&v(e.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(oe){for(let Y=0,ee=K.length;Y<ee;Y++){let ie=K[Y],be=r.get(ie),fe=e.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(fe=C.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),t.bindTexture(fe,be.__webglTexture),$e(fe,ie),_e(B.__webglFramebuffer,C,ie,e.COLOR_ATTACHMENT0+Y,fe,0),m(ie)&&v(fe)}t.unbindTexture()}else{let Y=e.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(Y=C.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),t.bindTexture(Y,V.__webglTexture),$e(Y,E),E.mipmaps&&E.mipmaps.length>0)for(let ee=0;ee<E.mipmaps.length;ee++)_e(B.__webglFramebuffer[ee],C,E,e.COLOR_ATTACHMENT0,Y,ee);else _e(B.__webglFramebuffer,C,E,e.COLOR_ATTACHMENT0,Y,0);m(E)&&v(Y),t.unbindTexture()}C.depthBuffer&&Ie(C)}function Fe(C){let E=C.textures;for(let B=0,V=E.length;B<V;B++){let K=E[B];if(m(K)){let re=x(C),oe=r.get(K).__webglTexture;t.bindTexture(re,oe),v(re),t.unbindTexture()}}}let lt=[],Rt=[];function Bt(C){if(C.samples>0){if(_t(C)===!1){let E=C.textures,B=C.width,V=C.height,K=e.COLOR_BUFFER_BIT,re=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,oe=r.get(C),Y=E.length>1;if(Y)for(let ie=0;ie<E.length;ie++)t.bindFramebuffer(e.FRAMEBUFFER,oe.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ie,e.RENDERBUFFER,null),t.bindFramebuffer(e.FRAMEBUFFER,oe.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ie,e.TEXTURE_2D,null,0);t.bindFramebuffer(e.READ_FRAMEBUFFER,oe.__webglMultisampledFramebuffer);let ee=C.texture.mipmaps;ee&&ee.length>0?t.bindFramebuffer(e.DRAW_FRAMEBUFFER,oe.__webglFramebuffer[0]):t.bindFramebuffer(e.DRAW_FRAMEBUFFER,oe.__webglFramebuffer);for(let ie=0;ie<E.length;ie++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(K|=e.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(K|=e.STENCIL_BUFFER_BIT)),Y){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,oe.__webglColorRenderbuffer[ie]);let be=r.get(E[ie]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,be,0)}e.blitFramebuffer(0,0,B,V,0,0,B,V,K,e.NEAREST),l===!0&&(lt.length=0,Rt.length=0,lt.push(e.COLOR_ATTACHMENT0+ie),C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&(lt.push(re),Rt.push(re),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,Rt)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,lt))}if(t.bindFramebuffer(e.READ_FRAMEBUFFER,null),t.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),Y)for(let ie=0;ie<E.length;ie++){t.bindFramebuffer(e.FRAMEBUFFER,oe.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ie,e.RENDERBUFFER,oe.__webglColorRenderbuffer[ie]);let be=r.get(E[ie]).__webglTexture;t.bindFramebuffer(e.FRAMEBUFFER,oe.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ie,e.TEXTURE_2D,be,0)}t.bindFramebuffer(e.DRAW_FRAMEBUFFER,oe.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&l){let E=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[E])}}}function ut(C){return Math.min(o.maxSamples,C.samples)}function _t(C){let E=r.get(C);return C.samples>0&&n.has("WEBGL_multisampled_render_to_texture")===!0&&E.__useRenderToTexture!==!1}function O(C){let E=a.render.frame;c.get(C)!==E&&(c.set(C,E),C.update())}function Ut(C,E){let B=C.colorSpace,V=C.format,K=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||B!==ss&&B!==un&&(ct.getTransfer(B)===tt?(V!==Qt||K!==$t)&&qe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):it("WebGLTextures: Unsupported texture color space:",B)),E}function Ze(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(f.width=C.naturalWidth||C.width,f.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(f.width=C.displayWidth,f.height=C.displayHeight):(f.width=C.width,f.height=C.height),f}this.allocateTextureUnit=z,this.resetTextureUnits=U,this.getTextureUnits=L,this.setTextureUnits=H,this.setTexture2D=X,this.setTexture2DArray=$,this.setTexture3D=j,this.setTextureCube=Z,this.rebindTextures=Xe,this.setupRenderTarget=nt,this.updateRenderTargetMipmap=Fe,this.updateMultisampleRenderTarget=Bt,this.setupDepthRenderbuffer=Ie,this.setupFrameBufferTexture=_e,this.useMultisampledRTT=_t,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function Lv(e,n){function t(r,o=un){let i,a=ct.getTransfer(o);if(r===$t)return e.UNSIGNED_BYTE;if(r===wa)return e.UNSIGNED_SHORT_4_4_4_4;if(r===Aa)return e.UNSIGNED_SHORT_5_5_5_1;if(r===Mf)return e.UNSIGNED_INT_5_9_9_9_REV;if(r===Tf)return e.UNSIGNED_INT_10F_11F_11F_REV;if(r===xf)return e.BYTE;if(r===Ef)return e.SHORT;if(r===uo)return e.UNSIGNED_SHORT;if(r===ba)return e.INT;if(r===Bn)return e.UNSIGNED_INT;if(r===Cn)return e.FLOAT;if(r===xn)return e.HALF_FLOAT;if(r===bf)return e.ALPHA;if(r===wf)return e.RGB;if(r===Qt)return e.RGBA;if(r===er)return e.DEPTH_COMPONENT;if(r===tr)return e.DEPTH_STENCIL;if(r===Jo)return e.RED;if(r===Ra)return e.RED_INTEGER;if(r===nr)return e.RG;if(r===ya)return e.RG_INTEGER;if(r===Ca)return e.RGBA_INTEGER;if(r===ei||r===ti||r===ni||r===ri)if(a===tt)if(i=n.get("WEBGL_compressed_texture_s3tc_srgb"),i!==null){if(r===ei)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===ti)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===ni)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===ri)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(i=n.get("WEBGL_compressed_texture_s3tc"),i!==null){if(r===ei)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===ti)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===ni)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===ri)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===Pa||r===La||r===Da||r===Ua)if(i=n.get("WEBGL_compressed_texture_pvrtc"),i!==null){if(r===Pa)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===La)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===Da)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===Ua)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===Ia||r===Na||r===Oa||r===Fa||r===Ha||r===oi||r===Ba)if(i=n.get("WEBGL_compressed_texture_etc"),i!==null){if(r===Ia||r===Na)return a===tt?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(r===Oa)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(r===Fa)return i.COMPRESSED_R11_EAC;if(r===Ha)return i.COMPRESSED_SIGNED_R11_EAC;if(r===oi)return i.COMPRESSED_RG11_EAC;if(r===Ba)return i.COMPRESSED_SIGNED_RG11_EAC}else return null;if(r===Ga||r===ka||r===Va||r===za||r===Wa||r===Xa||r===$a||r===Ka||r===Ya||r===qa||r===Za||r===ja||r===Qa||r===Ja)if(i=n.get("WEBGL_compressed_texture_astc"),i!==null){if(r===Ga)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===ka)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===Va)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===za)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===Wa)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===Xa)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===$a)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===Ka)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===Ya)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===qa)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===Za)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===ja)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===Qa)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===Ja)return a===tt?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===es||r===ts||r===ns)if(i=n.get("EXT_texture_compression_bptc"),i!==null){if(r===es)return a===tt?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(r===ts)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(r===ns)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(r===rs||r===os||r===ii||r===is)if(i=n.get("EXT_texture_compression_rgtc"),i!==null){if(r===rs)return i.COMPRESSED_RED_RGTC1_EXT;if(r===os)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(r===ii)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(r===is)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return r===Lr?e.UNSIGNED_INT_24_8:e[r]!==void 0?e[r]:null}return{convert:t}}var Dv=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Uv=`
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

}`,Vs=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(n,t){if(this.texture===null){let r=new vs(n.texture);(n.depthNear!==t.depthNear||n.depthFar!==t.depthFar)&&(this.depthNear=n.depthNear,this.depthFar=n.depthFar),this.texture=r}}getMesh(n){if(this.texture!==null&&this.mesh===null){let t=n.cameras[0].viewport,r=new en({vertexShader:Dv,fragmentShader:Uv,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new yt(new Lt(20,20),r)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},zs=class extends Hf{constructor(n,t){super();let r=this,o=null,i=1,a=null,s="local-floor",l=1,f=null,c=null,u=null,d=null,h=null,_=null,T=typeof XRWebGLBinding<"u",p=new Vs,m={},v=t.getContextAttributes(),x=null,g=null,M=[],b=[],A=new je,S=null,w=null,y=new mo;y.viewport=new Pt;let P=new mo;P.viewport=new Pt;let D=[y,P],U=new Jf,L=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let J=M[q];return J===void 0&&(J=new li,M[q]=J),J.getTargetRaySpace()},this.getControllerGrip=function(q){let J=M[q];return J===void 0&&(J=new li,M[q]=J),J.getGripSpace()},this.getHand=function(q){let J=M[q];return J===void 0&&(J=new li,M[q]=J),J.getHandSpace()};function z(q){let J=b.indexOf(q.inputSource);if(J===-1)return;let xe=M[J];xe!==void 0&&(xe.update(q.inputSource,q.frame,f||a),xe.dispatchEvent({type:q.type,data:q.inputSource}))}function F(){o.removeEventListener("select",z),o.removeEventListener("selectstart",z),o.removeEventListener("selectend",z),o.removeEventListener("squeeze",z),o.removeEventListener("squeezestart",z),o.removeEventListener("squeezeend",z),o.removeEventListener("end",F),o.removeEventListener("inputsourceschange",X);for(let q=0;q<M.length;q++){let J=b[q];J!==null&&(b[q]=null,M[q].disconnect(J))}L=null,H=null,p.reset();for(let q in m)delete m[q];if(n.setRenderTarget(x),h=null,d=null,u=null,o=null,g=null,We.stop(),r.isPresenting=!1,n.setPixelRatio(S),n.setSize(A.width,A.height,!1),w!==null){let q=w.camera;q.fov=w.fov,q.zoom=w.zoom,q.updateProjectionMatrix(),w=null}r.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){i=q,r.isPresenting===!0&&qe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){s=q,r.isPresenting===!0&&qe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return f||a},this.setReferenceSpace=function(q){f=q},this.getBaseLayer=function(){return d!==null?d:h},this.getBinding=function(){return u===null&&T&&(u=new XRWebGLBinding(o,t)),u},this.getFrame=function(){return _},this.getSession=function(){return o},this.setSession=async function(q){if(o=q,o!==null){if(x=n.getRenderTarget(),o.addEventListener("select",z),o.addEventListener("selectstart",z),o.addEventListener("selectend",z),o.addEventListener("squeeze",z),o.addEventListener("squeezestart",z),o.addEventListener("squeezeend",z),o.addEventListener("end",F),o.addEventListener("inputsourceschange",X),v.xrCompatible!==!0&&await t.makeXRCompatible(),S=n.getPixelRatio(),n.getSize(A),T&&"createProjectionLayer"in XRWebGLBinding.prototype){let xe=null,Ue=null,_e=null;v.depth&&(_e=v.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,xe=v.stencil?tr:er,Ue=v.stencil?Lr:Bn);let Ge={colorFormat:t.RGBA8,depthFormat:_e,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(Ge),o.updateRenderState({layers:[d]}),n.setPixelRatio(1),n.setSize(d.textureWidth,d.textureHeight,!1),g=new Jt(d.textureWidth,d.textureHeight,{format:Qt,type:$t,depthTexture:new po(d.textureWidth,d.textureHeight,Ue,void 0,void 0,void 0,void 0,void 0,void 0,xe),stencilBuffer:v.stencil,colorSpace:n.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let xe={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:i};h=new XRWebGLLayer(o,t,xe),o.updateRenderState({baseLayer:h}),n.setPixelRatio(1),n.setSize(h.framebufferWidth,h.framebufferHeight,!1),g=new Jt(h.framebufferWidth,h.framebufferHeight,{format:Qt,type:$t,colorSpace:n.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}g.isXRRenderTarget=!0,this.setFoveation(l),f=null,a=await o.requestReferenceSpace(s),We.setContext(o),We.start(),r.isPresenting=!0,r.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(o!==null)return o.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function X(q){for(let J=0;J<q.removed.length;J++){let xe=q.removed[J],Ue=b.indexOf(xe);Ue>=0&&(b[Ue]=null,M[Ue].disconnect(xe))}for(let J=0;J<q.added.length;J++){let xe=q.added[J],Ue=b.indexOf(xe);if(Ue===-1){for(let Ge=0;Ge<M.length;Ge++)if(Ge>=b.length){b.push(xe),Ue=Ge;break}else if(b[Ge]===null){b[Ge]=xe,Ue=Ge;break}if(Ue===-1)break}let _e=M[Ue];_e&&_e.connect(xe)}}let $=new te,j=new te;function Z(q,J,xe){$.setFromMatrixPosition(J.matrixWorld),j.setFromMatrixPosition(xe.matrixWorld);let Ue=$.distanceTo(j),_e=J.projectionMatrix.elements,Ge=xe.projectionMatrix.elements,Mt=_e[14]/(_e[10]-1),Ie=_e[14]/(_e[10]+1),Xe=(_e[9]+1)/_e[5],nt=(_e[9]-1)/_e[5],Fe=(_e[8]-1)/_e[0],lt=(Ge[8]+1)/Ge[0],Rt=Mt*Fe,Bt=Mt*lt,ut=Ue/(-Fe+lt),_t=ut*-Fe;if(J.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(_t),q.translateZ(ut),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),_e[10]===-1)q.projectionMatrix.copy(J.projectionMatrix),q.projectionMatrixInverse.copy(J.projectionMatrixInverse);else{let O=Mt+ut,Ut=Ie+ut,Ze=Rt-_t,C=Bt+(Ue-_t),E=Xe*Ie/Ut*O,B=nt*Ie/Ut*O;q.projectionMatrix.makePerspective(Ze,C,E,B,O,Ut),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function ge(q,J){J===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(J.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(o===null)return;let J=q.near,xe=q.far;p.texture!==null&&(p.depthNear>0&&(J=p.depthNear),p.depthFar>0&&(xe=p.depthFar)),U.near=P.near=y.near=J,U.far=P.far=y.far=xe,(L!==U.near||H!==U.far)&&(o.updateRenderState({depthNear:U.near,depthFar:U.far}),L=U.near,H=U.far),U.layers.mask=q.layers.mask|6,y.layers.mask=U.layers.mask&-5,P.layers.mask=U.layers.mask&-3;let Ue=q.parent,_e=U.cameras;ge(U,Ue);for(let Ge=0;Ge<_e.length;Ge++)ge(_e[Ge],Ue);_e.length===2?Z(U,y,P):U.projectionMatrix.copy(y.projectionMatrix),w===null&&q.isPerspectiveCamera&&(w={camera:q,fov:q.fov,zoom:q.zoom}),Ee(q,U,Ue)};function Ee(q,J,xe){xe===null?q.matrix.copy(J.matrixWorld):(q.matrix.copy(xe.matrixWorld),q.matrix.invert(),q.matrix.multiply(J.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(J.projectionMatrix),q.projectionMatrixInverse.copy(J.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=Bf*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return U},this.getFoveation=function(){if(!(d===null&&h===null))return l},this.setFoveation=function(q){l=q,d!==null&&(d.fixedFoveation=q),h!==null&&h.fixedFoveation!==void 0&&(h.fixedFoveation=q)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(U)},this.getCameraTexture=function(q){return m[q]};let ze=null;function $e(q,J){if(c=J.getViewerPose(f||a),_=J,c!==null){let xe=c.views;h!==null&&(n.setRenderTargetFramebuffer(g,h.framebuffer),n.setRenderTarget(g));let Ue=!1;xe.length!==U.cameras.length&&(U.cameras.length=0,Ue=!0);for(let Ie=0;Ie<xe.length;Ie++){let Xe=xe[Ie],nt=null;if(h!==null)nt=h.getViewport(Xe);else{let lt=u.getViewSubImage(d,Xe);nt=lt.viewport,Ie===0&&(n.setRenderTargetTextures(g,lt.colorTexture,lt.depthStencilTexture),n.setRenderTarget(g))}let Fe=D[Ie];Fe===void 0&&(Fe=new mo,Fe.layers.enable(Ie),Fe.viewport=new Pt,D[Ie]=Fe),Fe.matrix.fromArray(Xe.transform.matrix),Fe.matrix.decompose(Fe.position,Fe.quaternion,Fe.scale),Fe.projectionMatrix.fromArray(Xe.projectionMatrix),Fe.projectionMatrixInverse.copy(Fe.projectionMatrix).invert(),Fe.viewport.set(nt.x,nt.y,nt.width,nt.height),Ie===0&&(U.matrix.copy(Fe.matrix),U.matrix.decompose(U.position,U.quaternion,U.scale)),Ue===!0&&U.cameras.push(Fe)}let _e=o.enabledFeatures;if(_e&&_e.includes("depth-sensing")&&o.depthUsage=="gpu-optimized"&&T){u=r.getBinding();let Ie=u.getDepthInformation(xe[0]);Ie&&Ie.isValid&&Ie.texture&&p.init(Ie,o.renderState)}if(_e&&_e.includes("camera-access")&&T){n.state.unbindTexture(),u=r.getBinding();for(let Ie=0;Ie<xe.length;Ie++){let Xe=xe[Ie].camera;if(Xe){let nt=m[Xe];nt||(nt=new vs,m[Xe]=nt);let Fe=u.getCameraImage(Xe);nt.sourceTexture=Fe}}}}for(let xe=0;xe<M.length;xe++){let Ue=b[xe],_e=M[xe];Ue!==null&&_e!==void 0&&_e.update(Ue,J,f||a)}ze&&ze(q,J),J.detectedPlanes&&r.dispatchEvent({type:"planesdetected",data:J}),_=null}let We=new Pu;We.setAnimationLoop($e),this.setAnimationLoop=function(q){ze=q},this.dispose=function(){}}},Iv=new Yt,Ou=new Be;Ou.set(-1,0,0,0,1,0,0,0,1);function Nv(e,n){function t(p,m){p.matrixAutoUpdate===!0&&p.updateMatrix(),m.value.copy(p.matrix)}function r(p,m){m.color.getRGB(p.fogColor.value,xs(e)),m.isFog?(p.fogNear.value=m.near,p.fogFar.value=m.far):m.isFogExp2&&(p.fogDensity.value=m.density)}function o(p,m,v,x,g){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?i(p,m):m.isMeshLambertMaterial?(i(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(i(p,m),u(p,m)):m.isMeshPhongMaterial?(i(p,m),c(p,m),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(i(p,m),d(p,m),m.isMeshPhysicalMaterial&&h(p,m,g)):m.isMeshMatcapMaterial?(i(p,m),_(p,m)):m.isMeshDepthMaterial?i(p,m):m.isMeshDistanceMaterial?(i(p,m),T(p,m)):m.isMeshNormalMaterial?i(p,m):m.isLineBasicMaterial?(a(p,m),m.isLineDashedMaterial&&s(p,m)):m.isPointsMaterial?l(p,m,v,x):m.isSpriteMaterial?f(p,m):m.isShadowMaterial?(p.color.value.copy(m.color),p.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function i(p,m){p.opacity.value=m.opacity,m.color&&p.diffuse.value.copy(m.color),m.emissive&&p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.bumpMap&&(p.bumpMap.value=m.bumpMap,t(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===kt&&(p.bumpScale.value*=-1)),m.normalMap&&(p.normalMap.value=m.normalMap,t(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===kt&&p.normalScale.value.negate()),m.displacementMap&&(p.displacementMap.value=m.displacementMap,t(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias),m.emissiveMap&&(p.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,p.emissiveMapTransform)),m.specularMap&&(p.specularMap.value=m.specularMap,t(m.specularMap,p.specularMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest);let v=n.get(m),x=v.envMap,g=v.envMapRotation;x&&(p.envMap.value=x,p.envMapRotation.value.setFromMatrix4(Iv.makeRotationFromEuler(g)).transpose(),x.isCubeTexture&&x.isRenderTargetTexture===!1&&p.envMapRotation.value.premultiply(Ou),p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio),m.lightMap&&(p.lightMap.value=m.lightMap,p.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,p.lightMapTransform)),m.aoMap&&(p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,p.aoMapTransform))}function a(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform))}function s(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function l(p,m,v,x){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*v,p.scale.value=x*.5,m.map&&(p.map.value=m.map,t(m.map,p.uvTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function f(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map&&(p.map.value=m.map,t(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,t(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function c(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,1e-4)}function u(p,m){m.gradientMap&&(p.gradientMap.value=m.gradientMap)}function d(p,m){p.metalness.value=m.metalness,m.metalnessMap&&(p.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,p.metalnessMapTransform)),p.roughness.value=m.roughness,m.roughnessMap&&(p.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,p.roughnessMapTransform)),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)}function h(p,m,v){p.ior.value=m.ior,m.sheen>0&&(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(p.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,p.sheenColorMapTransform)),m.sheenRoughnessMap&&(p.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,p.sheenRoughnessMapTransform))),m.clearcoat>0&&(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(p.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,p.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(p.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===kt&&p.clearcoatNormalScale.value.negate())),m.dispersion>0&&(p.dispersion.value=m.dispersion),m.retroreflectivity>0&&(p.retroreflectivity.value=m.retroreflectivity),m.iridescence>0&&(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(p.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,p.iridescenceMapTransform)),m.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),m.transmission>0&&(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=v.texture,p.transmissionSamplerSize.value.set(v.width,v.height),m.transmissionMap&&(p.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,p.transmissionMapTransform)),p.thickness.value=m.thickness,m.thicknessMap&&(p.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(p.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap&&(p.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,p.specularColorMapTransform)),m.specularIntensityMap&&(p.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,p.specularIntensityMapTransform))}function _(p,m){m.matcap&&(p.matcap.value=m.matcap)}function T(p,m){let v=n.get(m).light;p.referencePosition.value.setFromMatrixPosition(v.matrixWorld),p.nearDistance.value=v.shadow.camera.near,p.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:o}}function Ov(e,n,t,r){let o={},i={},a=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function l(g,M){let b=M.program;r.uniformBlockBinding(g,b)}function f(g,M){let b=o[g.id];b===void 0&&(p(g),b=c(g),o[g.id]=b,g.addEventListener("dispose",v));let A=M.program;r.updateUBOMapping(g,A);let S=n.render.frame;i[g.id]!==S&&(d(g),i[g.id]=S)}function c(g){let M=u();g.__bindingPointIndex=M;let b=e.createBuffer(),A=g.__size,S=g.usage;return e.bindBuffer(e.UNIFORM_BUFFER,b),e.bufferData(e.UNIFORM_BUFFER,A,S),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,M,b),b}function u(){for(let g=0;g<s;g++)if(a.indexOf(g)===-1)return a.push(g),g;return it("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(g){let M=o[g.id],b=g.uniforms,A=g.__cache;e.bindBuffer(e.UNIFORM_BUFFER,M);for(let S=0,w=b.length;S<w;S++){let y=b[S];if(Array.isArray(y))for(let P=0,D=y.length;P<D;P++)h(y[P],S,P,A);else h(y,S,0,A)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function h(g,M,b,A){if(T(g,M,b,A)===!0){let S=g.__offset,w=g.value;if(Array.isArray(w)){let y=0;for(let P=0;P<w.length;P++){let D=w[P],U=m(D);_(D,g.__data,y),typeof D!="number"&&typeof D!="boolean"&&!D.isMatrix3&&!ArrayBuffer.isView(D)&&(y+=U.storage/Float32Array.BYTES_PER_ELEMENT)}}else _(w,g.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,S,g.__data)}}function _(g,M,b){typeof g=="number"||typeof g=="boolean"?M[0]=g:g.isMatrix3?(M[0]=g.elements[0],M[1]=g.elements[1],M[2]=g.elements[2],M[3]=0,M[4]=g.elements[3],M[5]=g.elements[4],M[6]=g.elements[5],M[7]=0,M[8]=g.elements[6],M[9]=g.elements[7],M[10]=g.elements[8],M[11]=0):ArrayBuffer.isView(g)?M.set(new g.constructor(g.buffer,g.byteOffset,M.length)):g.toArray(M,b)}function T(g,M,b,A){let S=g.value,w=M+"_"+b;if(A[w]===void 0)return typeof S=="number"||typeof S=="boolean"?A[w]=S:ArrayBuffer.isView(S)?A[w]=S.slice():A[w]=S.clone(),!0;{let y=A[w];if(typeof S=="number"||typeof S=="boolean"){if(y!==S)return A[w]=S,!0}else{if(ArrayBuffer.isView(S))return!0;if(y.equals(S)===!1)return y.copy(S),!0}}return!1}function p(g){let M=g.uniforms,b=0,A=16;for(let w=0,y=M.length;w<y;w++){let P=Array.isArray(M[w])?M[w]:[M[w]];for(let D=0,U=P.length;D<U;D++){let L=P[D],H=Array.isArray(L.value)?L.value:[L.value];for(let z=0,F=H.length;z<F;z++){let X=H[z],$=m(X),j=b%A,Z=j%$.boundary,ge=j+Z;b+=Z,ge!==0&&A-ge<$.storage&&(b+=A-ge),L.__data=new Float32Array($.storage/Float32Array.BYTES_PER_ELEMENT),L.__offset=b,b+=$.storage}}}let S=b%A;return S>0&&(b+=A-S),g.__size=b,g.__cache={},this}function m(g){let M={boundary:0,storage:0};return typeof g=="number"||typeof g=="boolean"?(M.boundary=4,M.storage=4):g.isVector2?(M.boundary=8,M.storage=8):g.isVector3||g.isColor?(M.boundary=16,M.storage=12):g.isVector4?(M.boundary=16,M.storage=16):g.isMatrix3?(M.boundary=48,M.storage=48):g.isMatrix4?(M.boundary=64,M.storage=64):g.isTexture?qe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(g)?(M.boundary=16,M.storage=g.byteLength):qe("WebGLRenderer: Unsupported uniform value type.",g),M}function v(g){let M=g.target;M.removeEventListener("dispose",v);let b=a.indexOf(M.__bindingPointIndex);a.splice(b,1),e.deleteBuffer(o[M.id]),delete o[M.id],delete i[M.id]}function x(){for(let g in o)e.deleteBuffer(o[g]);a=[],o={},i={}}return{bind:l,update:f,dispose:x}}var Fv=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Mn=null;function Hv(){return Mn===null&&(Mn=new Gn(Fv,16,16,nr,xn),Mn.name="DFG_LUT",Mn.minFilter=St,Mn.magFilter=St,Mn.wrapS=jo,Mn.wrapT=jo,Mn.generateMipmaps=!1,Mn.needsUpdate=!0),Mn}var Cu=class{constructor(n={}){let{canvas:t=If(),context:r=null,depth:o=!0,stencil:i=!1,alpha:a=!1,antialias:s=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:f=!1,powerPreference:c="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:h=$t}=n;this.isWebGLRenderer=!0;let _;if(r!==null){if(typeof WebGLRenderingContext<"u"&&r instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");_=r.getContextAttributes().alpha}else _=a;let T=h,p=new Set([Ca,ya,Ra]),m=new Set([$t,Bn,uo,Lr,wa,Aa]),v=new Uint32Array(4),x=new Int32Array(4),g=new te,M=null,b=null,A=[],S=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=cn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let y=this,P=!1,D=null,U=null,L=null,H=null;this._outputColorSpace=Dr;let z=0,F=0,X=null,$=-1,j=null,Z=new Pt,ge=new Pt,Ee=null,ze=new ye(0),$e=0,We=t.width,q=t.height,J=1,xe=null,Ue=null,_e=new Pt(0,0,We,q),Ge=new Pt(0,0,We,q),Mt=!1,Ie=new gs,Xe=!1,nt=!1,Fe=new Yt,lt=new te,Rt=new Pt,Bt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ut=!1;function _t(){return X===null?J:1}let O=r;function Ut(R,I){return t.getContext(R,I)}let Ze,C,E,B,V,K,re,oe,Y,ee,ie,be,fe,ae,we,Re,Le,N,se,Q,le,he,ne;try{let R={alpha:!0,depth:o,stencil:i,antialias:s,premultipliedAlpha:l,preserveDrawingBuffer:f,powerPreference:c,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",rt,!1),t.addEventListener("webglcontextrestored",Ke,!1),t.addEventListener("webglcontextcreationerror",ln,!1),O===null){let I="webgl2";if(O=Ut(I,R),O===null)throw Ut(I)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ae()}catch(R){throw t.removeEventListener("webglcontextlost",rt,!1),t.removeEventListener("webglcontextrestored",Ke,!1),t.removeEventListener("webglcontextcreationerror",ln,!1),it("WebGLRenderer: "+R.message),R}function Ae(){Ze=new Xg(O),Ze.init(),le=new Lv(O,Ze),C=new Ng(O,Ze,n,le),E=new Cv(O,Ze),C.reversedDepthBuffer&&d&&E.buffers.depth.setReversed(!0),U=O.createFramebuffer(),L=O.createFramebuffer(),H=O.createFramebuffer(),B=new Yg(O),V=new mv,K=new Pv(O,Ze,E,V,C,le,B),re=new Wg(y),oe=new Zp(O),he=new Ug(O,oe),Y=new $g(O,oe,B,he),ee=new Zg(O,Y,oe,he,B),N=new qg(O,C,K),we=new Og(V),ie=new pv(y,re,Ze,C,he,we),be=new Nv(y,V),fe=new _v,ae=new Tv(Ze),Le=new Dg(y,re,E,ee,_,l),Re=new yv(y,ee,C),ne=new Ov(O,B,C,E),se=new Ig(O,Ze,B),Q=new Kg(O,Ze,B),B.programs=ie.programs,y.capabilities=C,y.extensions=Ze,y.properties=V,y.renderLists=fe,y.shadowMap=Re,y.state=E,y.info=B}T!==$t&&(w=new Qg(T,t.width,t.height,s,o,i));let Me=new zs(y,O);this.xr=Me,this.getContext=function(){return O},this.getContextAttributes=function(){return O.getContextAttributes()},this.forceContextLoss=function(){let R=Ze.get("WEBGL_lose_context");R&&R.loseContext()},this.forceContextRestore=function(){let R=Ze.get("WEBGL_lose_context");R&&R.restoreContext()},this.getPixelRatio=function(){return J},this.setPixelRatio=function(R){R!==void 0&&(J=R,this.setSize(We,q,!1))},this.getSize=function(R){return R.set(We,q)},this.setSize=function(R,I,W=!0){if(Me.isPresenting){qe("WebGLRenderer: Can't change size while VR device is presenting.");return}We=R,q=I,t.width=Math.floor(R*J),t.height=Math.floor(I*J),W===!0&&(t.style.width=R+"px",t.style.height=I+"px"),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,R,I)},this.getDrawingBufferSize=function(R){return R.set(We*J,q*J).floor()},this.setDrawingBufferSize=function(R,I,W){We=R,q=I,J=W,t.width=Math.floor(R*W),t.height=Math.floor(I*W),this.setViewport(0,0,R,I)},this.setEffects=function(R){if(T===$t){it("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(R){for(let I=0;I<R.length;I++)if(R[I].isOutputPass===!0){qe("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}w.setEffects(R||[])},this.getCurrentViewport=function(R){return R.copy(Z)},this.getViewport=function(R){return R.copy(_e)},this.setViewport=function(R,I,W,G){R.isVector4?_e.set(R.x,R.y,R.z,R.w):_e.set(R,I,W,G),E.viewport(Z.copy(_e).multiplyScalar(J).round())},this.getScissor=function(R){return R.copy(Ge)},this.setScissor=function(R,I,W,G){R.isVector4?Ge.set(R.x,R.y,R.z,R.w):Ge.set(R,I,W,G),E.scissor(ge.copy(Ge).multiplyScalar(J).round())},this.getScissorTest=function(){return Mt},this.setScissorTest=function(R){E.setScissorTest(Mt=R)},this.setOpaqueSort=function(R){xe=R},this.setTransparentSort=function(R){Ue=R},this.getClearColor=function(R){return R.copy(Le.getClearColor())},this.setClearColor=function(){Le.setClearColor(...arguments)},this.getClearAlpha=function(){return Le.getClearAlpha()},this.setClearAlpha=function(){Le.setClearAlpha(...arguments)},this.clear=function(R=!0,I=!0,W=!0){let G=0;if(R){let k=!1;if(X!==null){let de=X.texture.format;k=p.has(de)}if(k){let de=X.texture.type,me=m.has(de),ue=Le.getClearColor(),ve=Le.getClearAlpha(),Te=ue.r,De=ue.g,Ne=ue.b;me?(v[0]=Te,v[1]=De,v[2]=Ne,v[3]=ve,O.clearBufferuiv(O.COLOR,0,v)):(x[0]=Te,x[1]=De,x[2]=Ne,x[3]=ve,O.clearBufferiv(O.COLOR,0,x))}else G|=O.COLOR_BUFFER_BIT}I&&(G|=O.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),W&&(G|=O.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),G!==0&&O.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(R){R.setRenderer(this),D=R},this.dispose=function(){t.removeEventListener("webglcontextlost",rt,!1),t.removeEventListener("webglcontextrestored",Ke,!1),t.removeEventListener("webglcontextcreationerror",ln,!1),Le.dispose(),fe.dispose(),ae.dispose(),V.dispose(),re.dispose(),ee.dispose(),he.dispose(),ne.dispose(),ie.dispose(),Me.dispose(),Me.removeEventListener("sessionstart",uc),Me.removeEventListener("sessionend",dc),Zn.stop()};function rt(R){R.preventDefault(),ds("WebGLRenderer: Context Lost."),P=!0}function Ke(){ds("WebGLRenderer: Context Restored."),P=!1;let R=B.autoReset,I=Re.enabled,W=Re.autoUpdate,G=Re.needsUpdate,k=Re.type;Ae(),B.autoReset=R,Re.enabled=I,Re.autoUpdate=W,Re.needsUpdate=G,Re.type=k}function ln(R){it("WebGLRenderer: A WebGL context could not be created. Reason: ",R.statusMessage)}function _n(R){let I=R.target;I.removeEventListener("dispose",_n),Hp(I)}function Hp(R){Bp(R),V.remove(R)}function Bp(R){let I=V.get(R).programs;I!==void 0&&(I.forEach(function(W){ie.releaseProgram(W)}),R.isShaderMaterial&&ie.releaseShaderCache(R))}this.renderBufferDirect=function(R,I,W,G,k,de){I===null&&(I=Bt);let me=k.isMesh&&k.matrixWorld.determinantAffine()<0,ue=Vp(R,I,W,G,k);E.setMaterial(G,me);let ve=W.index,Te=1;if(G.wireframe===!0){if(ve=Y.getWireframeAttribute(W),ve===void 0)return;Te=2}let De=W.drawRange,Ne=W.attributes.position,Se=De.start*Te,Ye=(De.start+De.count)*Te;de!==null&&(Se=Math.max(Se,de.start*Te),Ye=Math.min(Ye,(de.start+de.count)*Te)),ve!==null?(Se=Math.max(Se,0),Ye=Math.min(Ye,ve.count)):Ne!=null&&(Se=Math.max(Se,0),Ye=Math.min(Ye,Ne.count));let vt=Ye-Se;if(vt<0||vt===1/0)return;he.setup(k,G,ue,W,ve);let st,et=se;if(ve!==null&&(st=oe.get(ve),et=Q,et.setIndex(st)),k.isMesh)G.wireframe===!0?(E.setLineWidth(G.wireframeLinewidth*_t()),et.setMode(O.LINES)):et.setMode(O.TRIANGLES);else if(k.isLine){let It=G.linewidth;It===void 0&&(It=1),E.setLineWidth(It*_t()),k.isLineSegments?et.setMode(O.LINES):k.isLineLoop?et.setMode(O.LINE_LOOP):et.setMode(O.LINE_STRIP)}else k.isPoints?et.setMode(O.POINTS):k.isSprite&&et.setMode(O.TRIANGLES);if(k.isBatchedMesh)if(Ze.get("WEBGL_multi_draw"))et.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{let It=k._multiDrawStarts,pe=k._multiDrawCounts,Ft=k._multiDrawCount,ke=ve?oe.get(ve).bytesPerElement:1,Zt=V.get(G).currentProgram.getUniforms();for(let vn=0;vn<Ft;vn++)Zt.setValue(O,"_gl_DrawID",vn),et.render(It[vn]/ke,pe[vn])}else if(k.isInstancedMesh)et.renderInstances(Se,vt,k.count);else if(W.isInstancedBufferGeometry){let It=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,pe=Math.min(W.instanceCount,It);et.renderInstances(Se,vt,pe)}else et.render(Se,vt)};function fc(R,I,W,G){D!==null&&R.isNodeMaterial&&D.setObject(G,R),Xe===!0&&we.setState(R,W,!1),R.transparent===!0&&R.side===jt&&R.forceSinglePass===!1?(R.side=kt,R.needsUpdate=!0,Xo(R,I,G),R.side=yr,R.needsUpdate=!0,Xo(R,I,G),R.side=jt):Xo(R,I,G)}this.compile=function(R,I,W=null){W===null&&(W=R),D!==null&&D.renderStart(R,I,W),b=ae.get(W),b.init(I),S.push(b),W.traverseVisible(function(k){k.isLight&&k.layers.test(I.layers)&&(b.pushLight(k),k.castShadow&&b.pushShadow(k))}),R!==W&&R.traverseVisible(function(k){k.isLight&&k.layers.test(I.layers)&&(b.pushLight(k),k.castShadow&&b.pushShadow(k))}),b.setupLights(),D!==null&&D.updateLights(b.state.lightsArray),nt=this.localClippingEnabled,Xe=we.init(this.clippingPlanes,nt),Xe===!0&&we.setGlobalState(this.clippingPlanes,I),D!==null&&Re.render(b.state.shadowsArray,W,I);let G=new Set;return R.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;let de=k.material;if(de)if(Array.isArray(de))for(let me=0;me<de.length;me++){let ue=de[me];fc(ue,W,I,k),G.add(ue)}else fc(de,W,I,k),G.add(de)}),b=S.pop(),D!==null&&D.renderEnd(),G},this.compileAsync=function(R,I,W=null){let G=this.compile(R,I,W);return new Promise(k=>{function de(){if(G.forEach(function(me){let ve=V.get(me).currentProgram;(ve===void 0||ve.isReady())&&G.delete(me)}),G.size===0){k(R);return}setTimeout(de,10)}Ze.get("KHR_parallel_shader_compile")!==null?de():setTimeout(de,10)})};let aa=null;function Gp(R){aa&&aa(R)}function uc(){Zn.stop()}function dc(){Zn.start()}let Zn=new Pu;Zn.setAnimationLoop(Gp),typeof self<"u"&&Zn.setContext(self),this.setAnimationLoop=function(R){aa=R,Me.setAnimationLoop(R),R===null?Zn.stop():Zn.start()},Me.addEventListener("sessionstart",uc),Me.addEventListener("sessionend",dc),this.render=function(R,I){if(I!==void 0&&I.isCamera!==!0){it("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(P===!0)return;D!==null&&D.renderStart(R,I);let W=Me.enabled===!0&&Me.isPresenting===!0,G=w!==null&&(X===null||W)&&w.begin(y,X);if(R.matrixWorldAutoUpdate===!0&&R.updateMatrixWorld(),I.parent===null&&I.matrixWorldAutoUpdate===!0&&I.updateMatrixWorld(),Me.enabled===!0&&Me.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(Me.cameraAutoUpdate===!0&&Me.updateCamera(I),I=Me.getCamera()),R.isScene===!0&&R.onBeforeRender(y,R,I,X),b=ae.get(R,S.length),b.init(I),b.state.textureUnits=K.getTextureUnits(),S.push(b),Fe.multiplyMatrices(I.projectionMatrix,I.matrixWorldInverse),Ie.setFromProjectionMatrix(Fe,us,I.reversedDepth),nt=this.localClippingEnabled,Xe=we.init(this.clippingPlanes,nt),M=fe.get(R,A.length),M.init(),A.push(M),Me.enabled===!0&&Me.isPresenting===!0){let me=y.xr.getDepthSensingMesh();me!==null&&sa(me,I,-1/0,y.sortObjects)}sa(R,I,0,y.sortObjects),M.finish(),D!==null&&D.updateLights(b.state.lightsArray),y.sortObjects===!0&&M.sort(xe,Ue),ut=Me.enabled===!1||Me.isPresenting===!1||Me.hasDepthSensing()===!1,ut&&Le.addToRenderList(M,R),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),Xe===!0&&we.beginShadows();let k=b.state.shadowsArray;if(Re.render(k,R,I),Xe===!0&&we.endShadows(),(G&&w.hasRenderPass())===!1){let me=M.opaque,ue=M.transmissive;if(b.setupLights(),I.isArrayCamera){let ve=I.cameras;if(ue.length>0)for(let Te=0,De=ve.length;Te<De;Te++){let Ne=ve[Te];pc(me,ue,R,Ne)}ut&&Le.render(R);for(let Te=0,De=ve.length;Te<De;Te++){let Ne=ve[Te];hc(M,R,Ne,Ne.viewport)}}else ue.length>0&&pc(me,ue,R,I),ut&&Le.render(R),hc(M,R,I)}X!==null&&F===0&&(K.updateMultisampleRenderTarget(X),K.updateRenderTargetMipmap(X)),G&&w.end(y),R.isScene===!0&&R.onAfterRender(y,R,I),he.resetDefaultState(),$=-1,j=null,S.pop(),S.length>0?(b=S[S.length-1],K.setTextureUnits(b.state.textureUnits),Xe===!0&&we.setGlobalState(y.clippingPlanes,b.state.camera)):b=null,A.pop(),A.length>0?M=A[A.length-1]:M=null,D!==null&&D.renderEnd()};function sa(R,I,W,G){if(R.visible===!1)return;if(R.layers.test(I.layers)){if(R.isGroup)W=R.renderOrder;else if(R.isLOD)R.autoUpdate===!0&&R.update(I);else if(R.isLightProbeGrid)b.pushLightProbeGrid(R);else if(R.isLight)b.pushLight(R),R.castShadow&&b.pushShadow(R);else if(R.isSprite){if(!R.frustumCulled||R.intersectsFrustum(Ie)){G&&Rt.setFromMatrixPosition(R.matrixWorld).applyMatrix4(Fe);let me=ee.update(R),ue=R.material;ue.visible&&M.push(R,me,ue,W,Rt.z,null,I)}}else if((R.isMesh||R.isLine||R.isPoints)&&(!R.frustumCulled||R.intersectsFrustum(Ie))){let me=ee.update(R),ue=R.material;if(G&&(R.boundingSphere!==void 0?(R.boundingSphere===null&&R.computeBoundingSphere(),Rt.copy(R.boundingSphere.center)):(me.boundingSphere===null&&me.computeBoundingSphere(),Rt.copy(me.boundingSphere.center)),Rt.applyMatrix4(R.matrixWorld).applyMatrix4(Fe)),Array.isArray(ue)){let ve=me.groups;for(let Te=0,De=ve.length;Te<De;Te++){let Ne=ve[Te],Se=ue[Ne.materialIndex];Se&&Se.visible&&M.push(R,me,Se,W,Rt.z,Ne,I)}}else ue.visible&&M.push(R,me,ue,W,Rt.z,null,I)}}let de=R.children;for(let me=0,ue=de.length;me<ue;me++)sa(de[me],I,W,G)}function hc(R,I,W,G){let{opaque:k,transmissive:de,transparent:me}=R;b.setupLightsView(W),Xe===!0&&we.setGlobalState(y.clippingPlanes,W),G&&E.viewport(Z.copy(G)),k.length>0&&Wo(k,I,W),de.length>0&&Wo(de,I,W),me.length>0&&Wo(me,I,W),E.buffers.depth.setTest(!0),E.buffers.depth.setMask(!0),E.buffers.color.setMask(!0),E.setPolygonOffset(!1)}function pc(R,I,W,G){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(b.state.transmissionRenderTarget[G.id]===void 0){let Se=Ze.has("EXT_color_buffer_half_float")||Ze.has("EXT_color_buffer_float");b.state.transmissionRenderTarget[G.id]=new Jt(1,1,{generateMipmaps:!0,type:Se?xn:$t,minFilter:Xt,samples:Math.max(4,C.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ct.workingColorSpace})}let de=b.state.transmissionRenderTarget[G.id],me=G.viewport||Z;de.setSize(me.z*y.transmissionResolutionScale,me.w*y.transmissionResolutionScale);let ue=y.getRenderTarget(),ve=y.getActiveCubeFace(),Te=y.getActiveMipmapLevel();y.setRenderTarget(de),y.getClearColor(ze),$e=y.getClearAlpha(),$e<1&&y.setClearColor(16777215,.5),y.clear(),ut&&Le.render(W);let De=y.toneMapping;y.toneMapping=cn;let Ne=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),b.setupLightsView(G),Xe===!0&&we.setGlobalState(y.clippingPlanes,G),Wo(R,W,G),K.updateMultisampleRenderTarget(de),K.updateRenderTargetMipmap(de),Ze.has("WEBGL_multisampled_render_to_texture")===!1){let Se=!1;for(let Ye=0,vt=I.length;Ye<vt;Ye++){let st=I[Ye],{object:et,geometry:It,material:pe,group:Ft}=st;if(pe.side===jt&&et.layers.test(G.layers)){let ke=pe.side;pe.side=kt,pe.needsUpdate=!0,mc(et,W,G,It,pe,Ft),pe.side=ke,pe.needsUpdate=!0,Se=!0}}Se===!0&&(K.updateMultisampleRenderTarget(de),K.updateRenderTargetMipmap(de))}y.setRenderTarget(ue,ve,Te),y.setClearColor(ze,$e),Ne!==void 0&&(G.viewport=Ne),y.toneMapping=De}function Wo(R,I,W){let G=I.isScene===!0?I.overrideMaterial:null;for(let k=0,de=R.length;k<de;k++){let me=R[k],{object:ue,geometry:ve,group:Te}=me,De=me.material;De.allowOverride===!0&&G!==null&&(De=G),ue.layers.test(W.layers)&&mc(ue,I,W,ve,De,Te)}}function mc(R,I,W,G,k,de){D!==null&&k.isNodeMaterial&&D.setObject(R,k),R.onBeforeRender(y,I,W,G,k,de),R.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,R.matrixWorld),R.normalMatrix.getNormalMatrix(R.modelViewMatrix),k.onBeforeRender(y,I,W,G,R,de),k.transparent===!0&&k.side===jt&&k.forceSinglePass===!1?(k.side=kt,k.needsUpdate=!0,y.renderBufferDirect(W,I,G,k,R,de),k.side=yr,k.needsUpdate=!0,y.renderBufferDirect(W,I,G,k,R,de),k.side=jt):y.renderBufferDirect(W,I,G,k,R,de),R.onAfterRender(y,I,W,G,k,de)}function Xo(R,I,W){I.isScene!==!0&&(I=Bt);let G=V.get(R),k=b.state.lights,de=b.state.shadowsArray,me=k.state.version,ue=ie.getParameters(R,k.state,de,I,W,b.state.lightProbeGridArray),ve=ie.getProgramCacheKey(ue),Te=G.programs;G.environment=R.isMeshStandardMaterial||R.isMeshLambertMaterial||R.isMeshPhongMaterial?I.environment:null,G.fog=I.fog;let De=R.isMeshStandardMaterial||R.isMeshLambertMaterial&&!R.envMap||R.isMeshPhongMaterial&&!R.envMap;G.envMap=re.get(R.envMap||G.environment,De),G.envMapRotation=G.environment!==null&&R.envMap===null?I.environmentRotation:R.envMapRotation,Te===void 0&&(R.addEventListener("dispose",_n),Te=new Map,G.programs=Te);let Ne=Te.get(ve);if(Ne!==void 0){if(G.currentProgram===Ne&&G.lightsStateVersion===me)return _c(R,ue),Ne}else ue.uniforms=ie.getUniforms(R),D!==null&&R.isNodeMaterial&&D.build(R,W,ue),R.onBeforeCompile(ue,y),Ne=ie.acquireProgram(ue,ve),Te.set(ve,Ne),G.uniforms=ue.uniforms;let Se=G.uniforms;return(!R.isShaderMaterial&&!R.isRawShaderMaterial||R.clipping===!0)&&(Se.clippingPlanes=we.uniform),_c(R,ue),G.needsLights=Wp(R),G.lightsStateVersion=me,G.needsLights&&(Se.ambientLightColor.value=k.state.ambient,Se.lightProbe.value=k.state.probe,Se.sunLights.value=k.state.sun,Se.sunLightShadows.value=k.state.sunShadow,Se.directionalLights.value=k.state.directional,Se.directionalLightShadows.value=k.state.directionalShadow,Se.spotLights.value=k.state.spot,Se.spotLightShadows.value=k.state.spotShadow,Se.rectAreaLights.value=k.state.rectArea,Se.ltc_1.value=k.state.rectAreaLTC1,Se.ltc_2.value=k.state.rectAreaLTC2,Se.pointLights.value=k.state.point,Se.pointLightShadows.value=k.state.pointShadow,Se.hemisphereLights.value=k.state.hemi,Se.sunShadowMatrix.value=k.state.sunShadowMatrix,Se.sunShadowCascade.value=k.state.sunShadowCascade,Se.directionalShadowMatrix.value=k.state.directionalShadowMatrix,Se.spotLightMatrix.value=k.state.spotLightMatrix,Se.spotLightMap.value=k.state.spotLightMap,Se.pointShadowMatrix.value=k.state.pointShadowMatrix),G.lightProbeGrid=b.state.lightProbeGridArray.length>0,G.currentProgram=Ne,G.uniformsList=null,Ne}function gc(R){if(R.uniformsList===null){let I=R.currentProgram.getUniforms();R.uniformsList=Fr.seqWithValue(I.seq,R.uniforms)}return R.uniformsList}function _c(R,I){let W=V.get(R);W.outputColorSpace=I.outputColorSpace,W.batching=I.batching,W.batchingColor=I.batchingColor,W.instancing=I.instancing,W.instancingColor=I.instancingColor,W.instancingMorph=I.instancingMorph,W.skinning=I.skinning,W.morphTargets=I.morphTargets,W.morphNormals=I.morphNormals,W.morphColors=I.morphColors,W.morphTargetsCount=I.morphTargetsCount,W.numClippingPlanes=I.numClippingPlanes,W.numIntersection=I.numClipIntersection,W.vertexAlphas=I.vertexAlphas,W.vertexTangents=I.vertexTangents,W.toneMapping=I.toneMapping}function kp(R,I){if(R.length===0)return null;if(R.length===1)return R[0].texture!==null?R[0]:null;g.setFromMatrixPosition(I.matrixWorld);for(let W=0,G=R.length;W<G;W++){let k=R[W];if(k.texture!==null&&k.boundingBox.containsPoint(g))return k}return null}function Vp(R,I,W,G,k){I.isScene!==!0&&(I=Bt),K.resetTextureUnits();let de=I.fog,me=G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial?I.environment:null,ue=X===null?y.outputColorSpace:X.isXRRenderTarget===!0?X.texture.colorSpace:ct.workingColorSpace,ve=G.isMeshStandardMaterial||G.isMeshLambertMaterial&&!G.envMap||G.isMeshPhongMaterial&&!G.envMap,Te=re.get(G.envMap||me,ve),De=G.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Ne=!!W.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),Se=!!W.morphAttributes.position,Ye=!!W.morphAttributes.normal,vt=!!W.morphAttributes.color,st=cn;G.toneMapped&&(X===null||X.isXRRenderTarget===!0)&&(st=y.toneMapping);let et=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,It=et!==void 0?et.length:0,pe=V.get(G),Ft=b.state.lights;if(Xe===!0&&(nt===!0||R!==j)){let ot=R===j&&G.id===$;we.setState(G,R,ot)}let ke=!1;G.version===pe.__version?(pe.needsLights&&pe.lightsStateVersion!==Ft.state.version||pe.outputColorSpace!==ue||k.isBatchedMesh&&pe.batching===!1||!k.isBatchedMesh&&pe.batching===!0||k.isBatchedMesh&&pe.batchingColor===!0&&k._colorsTexture===null||k.isBatchedMesh&&pe.batchingColor===!1&&k._colorsTexture!==null||k.isInstancedMesh&&pe.instancing===!1||!k.isInstancedMesh&&pe.instancing===!0||k.isSkinnedMesh&&pe.skinning===!1||!k.isSkinnedMesh&&pe.skinning===!0||k.isInstancedMesh&&pe.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&pe.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&pe.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&pe.instancingMorph===!1&&k.morphTexture!==null||pe.envMap!==Te||G.fog===!0&&pe.fog!==de||pe.numClippingPlanes!==void 0&&(pe.numClippingPlanes!==we.numPlanes||pe.numIntersection!==we.numIntersection)||pe.vertexAlphas!==De||pe.vertexTangents!==Ne||pe.morphTargets!==Se||pe.morphNormals!==Ye||pe.morphColors!==vt||pe.toneMapping!==st||pe.morphTargetsCount!==It||!!pe.lightProbeGrid!=b.state.lightProbeGridArray.length>0)&&(ke=!0):(ke=!0,pe.__version=G.version);let Zt=pe.currentProgram;ke===!0&&(Zt=Xo(G,I,k),D&&G.isNodeMaterial&&D.onUpdateProgram(G,Zt,pe));let vn=!1,Nn=!1,Er=!1,Qe=Zt.getUniforms(),gt=pe.uniforms;if(E.useProgram(Zt.program)&&(vn=!0,Nn=!0,Er=!0),G.id!==$&&($=G.id,Nn=!0),pe.needsLights){let ot=kp(b.state.lightProbeGridArray,k);pe.lightProbeGrid!==ot&&(pe.lightProbeGrid=ot,Nn=!0)}if(vn||j!==R){E.buffers.depth.getReversed()&&R.reversedDepth!==!0&&(R._reversedDepth=!0,R.updateProjectionMatrix()),Qe.setValue(O,"projectionMatrix",R.projectionMatrix),Qe.setValue(O,"viewMatrix",R.matrixWorldInverse);let Fn=Qe.map.cameraPosition;Fn!==void 0&&Fn.setValue(O,lt.setFromMatrixPosition(R.matrixWorld)),C.logarithmicDepthBuffer&&Qe.setValue(O,"logDepthBufFC",2/(Math.log(R.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&Qe.setValue(O,"isOrthographic",R.isOrthographicCamera===!0),j!==R&&(j=R,Nn=!0,Er=!0)}if(pe.needsLights&&(Ft.state.sunShadowMap.length>0&&Qe.setValue(O,"sunShadowMap",Ft.state.sunShadowMap,K),Ft.state.directionalShadowMap.length>0&&Qe.setValue(O,"directionalShadowMap",Ft.state.directionalShadowMap,K),Ft.state.spotShadowMap.length>0&&Qe.setValue(O,"spotShadowMap",Ft.state.spotShadowMap,K),Ft.state.pointShadowMap.length>0&&Qe.setValue(O,"pointShadowMap",Ft.state.pointShadowMap,K)),k.isSkinnedMesh){Qe.setOptional(O,k,"bindMatrix"),Qe.setOptional(O,k,"bindMatrixInverse");let ot=k.skeleton;ot&&(ot.boneTexture===null&&ot.computeBoneTexture(),Qe.setValue(O,"boneTexture",ot.boneTexture,K))}k.isBatchedMesh&&(Qe.setOptional(O,k,"batchingTexture"),Qe.setValue(O,"batchingTexture",k._matricesTexture,K),Qe.setOptional(O,k,"batchingIdTexture"),Qe.setValue(O,"batchingIdTexture",k._indirectTexture,K),Qe.setOptional(O,k,"batchingColorTexture"),k._colorsTexture!==null&&Qe.setValue(O,"batchingColorTexture",k._colorsTexture,K));let On=W.morphAttributes;if((On.position!==void 0||On.normal!==void 0||On.color!==void 0)&&N.update(k,W,Zt),(Nn||pe.receiveShadow!==k.receiveShadow)&&(pe.receiveShadow=k.receiveShadow,Qe.setValue(O,"receiveShadow",k.receiveShadow)),(G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial)&&G.envMap===null&&I.environment!==null&&(gt.envMapIntensity.value=I.environmentIntensity),gt.dfgLUT!==void 0&&(gt.dfgLUT.value=Hv()),Nn){if(Qe.setValue(O,"toneMappingExposure",y.toneMappingExposure),pe.needsLights&&zp(gt,Er),de&&G.fog===!0&&be.refreshFogUniforms(gt,de),be.refreshMaterialUniforms(gt,G,J,q,b.state.transmissionRenderTarget[R.id]),pe.needsLights&&pe.lightProbeGrid){let ot=pe.lightProbeGrid;gt.probesSH.value=ot.texture,gt.probesMin.value.copy(ot.boundingBox.min),gt.probesMax.value.copy(ot.boundingBox.max),gt.probesResolution.value.copy(ot.resolution)}Fr.upload(O,gc(pe),gt,K)}if(G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&(Fr.upload(O,gc(pe),gt,K),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&Qe.setValue(O,"center",k.center),Qe.setValue(O,"modelViewMatrix",k.modelViewMatrix),Qe.setValue(O,"normalMatrix",k.normalMatrix),Qe.setValue(O,"modelMatrix",k.matrixWorld),G.uniformsGroups!==void 0){let ot=G.uniformsGroups;for(let Fn=0,Mr=ot.length;Fn<Mr;Fn++){let Sc=ot[Fn];ne.update(Sc,Zt),ne.bind(Sc,Zt)}}return Zt}function zp(R,I){R.ambientLightColor.needsUpdate=I,R.lightProbe.needsUpdate=I,R.sunLights.needsUpdate=I,R.sunLightShadows.needsUpdate=I,R.directionalLights.needsUpdate=I,R.directionalLightShadows.needsUpdate=I,R.pointLights.needsUpdate=I,R.pointLightShadows.needsUpdate=I,R.spotLights.needsUpdate=I,R.spotLightShadows.needsUpdate=I,R.rectAreaLights.needsUpdate=I,R.hemisphereLights.needsUpdate=I}function Wp(R){return R.isMeshLambertMaterial||R.isMeshToonMaterial||R.isMeshPhongMaterial||R.isMeshStandardMaterial||R.isShadowMaterial||R.isShaderMaterial&&R.lights===!0}this.getActiveCubeFace=function(){return z},this.getActiveMipmapLevel=function(){return F},this.getRenderTarget=function(){return X},this.setRenderTargetTextures=function(R,I,W){let G=V.get(R);G.__autoAllocateDepthBuffer=R.resolveDepthBuffer===!1,G.__autoAllocateDepthBuffer===!1&&(G.__useRenderToTexture=!1),V.get(R.texture).__webglTexture=I,V.get(R.depthTexture).__webglTexture=G.__autoAllocateDepthBuffer?void 0:W,G.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(R,I){let W=V.get(R);W.__webglFramebuffer=I,W.__useDefaultFramebuffer=I===void 0},this.setRenderTarget=function(R,I=0,W=0){X=R,z=I,F=W;let G=null,k=!1,de=!1;if(R){let ue=V.get(R);if(ue.__useDefaultFramebuffer!==void 0){E.bindFramebuffer(O.FRAMEBUFFER,ue.__webglFramebuffer),Z.copy(R.viewport),ge.copy(R.scissor),Ee=R.scissorTest,E.viewport(Z),E.scissor(ge),E.setScissorTest(Ee),$=-1;return}else if(ue.__webglFramebuffer===void 0)K.setupRenderTarget(R);else if(ue.__hasExternalTextures)K.rebindTextures(R,V.get(R.texture).__webglTexture,V.get(R.depthTexture).__webglTexture);else if(R.depthBuffer){let De=R.depthTexture;if(ue.__boundDepthTexture!==De){if(De!==null&&V.has(De)&&(R.width!==De.image.width||R.height!==De.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");K.setupDepthRenderbuffer(R)}}let ve=R.texture;(ve.isData3DTexture||ve.isDataArrayTexture||ve.isCompressedArrayTexture)&&(de=!0);let Te=V.get(R).__webglFramebuffer;R.isWebGLCubeRenderTarget?(Array.isArray(Te[I])?G=Te[I][W]:G=Te[I],k=!0):R.samples>0&&K.useMultisampledRTT(R)===!1?G=V.get(R).__webglMultisampledFramebuffer:Array.isArray(Te)?G=Te[W]:G=Te,Z.copy(R.viewport),ge.copy(R.scissor),Ee=R.scissorTest}else Z.copy(_e).multiplyScalar(J).floor(),ge.copy(Ge).multiplyScalar(J).floor(),Ee=Mt;if(W!==0&&(G=U),E.bindFramebuffer(O.FRAMEBUFFER,G)&&E.drawBuffers(R,G),E.viewport(Z),E.scissor(ge),E.setScissorTest(Ee),k){let ue=V.get(R.texture);O.framebufferTexture2D(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_CUBE_MAP_POSITIVE_X+I,ue.__webglTexture,W)}else if(de){let ue=I;for(let ve=0;ve<R.textures.length;ve++){let Te=V.get(R.textures[ve]);O.framebufferTextureLayer(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0+ve,Te.__webglTexture,W,ue)}}else if(R!==null&&W!==0){let ue=V.get(R.texture);O.framebufferTexture2D(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_2D,ue.__webglTexture,W)}$=-1};function vc(R){let I=V.get(R);return(I.__readFormat!==R.format||I.__readType!==R.type)&&(I.__readFormat=R.format,I.__readType=R.type,I.__formatReadable=C.textureFormatReadable(R.format),I.__typeReadable=C.textureTypeReadable(R.type)),I}this.readRenderTargetPixels=function(R,I,W,G,k,de,me,ue=0){if(!(R&&R.isWebGLRenderTarget)){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ve=V.get(R).__webglFramebuffer;if(R.isWebGLCubeRenderTarget&&me!==void 0&&(ve=ve[me]),ve){E.bindFramebuffer(O.FRAMEBUFFER,ve);try{let Te=R.textures[ue],De=Te.format,Ne=Te.type;R.textures.length>1&&O.readBuffer(O.COLOR_ATTACHMENT0+ue);let Se=vc(Te);if(Se.__formatReadable===!1){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Se.__typeReadable===!1){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}I>=0&&I<=R.width-G&&W>=0&&W<=R.height-k&&O.readPixels(I,W,G,k,le.convert(De),le.convert(Ne),de)}finally{let Te=X!==null?V.get(X).__webglFramebuffer:null;E.bindFramebuffer(O.FRAMEBUFFER,Te)}}},this.readRenderTargetPixelsAsync=async function(R,I,W,G,k,de,me,ue=0){if(!(R&&R.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ve=V.get(R).__webglFramebuffer;if(R.isWebGLCubeRenderTarget&&me!==void 0&&(ve=ve[me]),ve)if(I>=0&&I<=R.width-G&&W>=0&&W<=R.height-k){E.bindFramebuffer(O.FRAMEBUFFER,ve);let Te=R.textures[ue],De=Te.format,Ne=Te.type;R.textures.length>1&&O.readBuffer(O.COLOR_ATTACHMENT0+ue);let Se=vc(Te);if(Se.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Se.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ye=O.createBuffer();O.bindBuffer(O.PIXEL_PACK_BUFFER,Ye),O.bufferData(O.PIXEL_PACK_BUFFER,de.byteLength,O.STREAM_READ),O.readPixels(I,W,G,k,le.convert(De),le.convert(Ne),0),O.bindBuffer(O.PIXEL_PACK_BUFFER,null);let vt=X!==null?V.get(X).__webglFramebuffer:null;E.bindFramebuffer(O.FRAMEBUFFER,vt);let st=O.fenceSync(O.SYNC_GPU_COMMANDS_COMPLETE,0);return O.flush(),await Of(O,st,4),O.bindBuffer(O.PIXEL_PACK_BUFFER,Ye),O.getBufferSubData(O.PIXEL_PACK_BUFFER,0,de),O.bindBuffer(O.PIXEL_PACK_BUFFER,null),O.deleteBuffer(Ye),O.deleteSync(st),de}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(R,I=null,W=0){let G=Math.pow(2,-W),k=Math.floor(R.image.width*G),de=Math.floor(R.image.height*G),me=I!==null?I.x:0,ue=I!==null?I.y:0;K.setTexture2D(R,0),O.copyTexSubImage2D(O.TEXTURE_2D,W,0,0,me,ue,k,de),E.unbindTexture()},this.copyTextureToTexture=function(R,I,W=null,G=null,k=0,de=0){let me,ue,ve,Te,De,Ne,Se,Ye,vt,st=R.isCompressedTexture?R.mipmaps[de]:R.image;if(W!==null)me=W.max.x-W.min.x,ue=W.max.y-W.min.y,ve=W.isBox3?W.max.z-W.min.z:1,Te=W.min.x,De=W.min.y,Ne=W.isBox3?W.min.z:0;else{let gt=Math.pow(2,-k);me=Math.floor(st.width*gt),ue=Math.floor(st.height*gt),R.isDataArrayTexture?ve=st.depth:R.isData3DTexture?ve=Math.floor(st.depth*gt):ve=1,Te=0,De=0,Ne=0}G!==null?(Se=G.x,Ye=G.y,vt=G.z):(Se=0,Ye=0,vt=0);let et=le.convert(I.format),It=le.convert(I.type),pe;I.isData3DTexture?(K.setTexture3D(I,0),pe=O.TEXTURE_3D):I.isDataArrayTexture||I.isCompressedArrayTexture?(K.setTexture2DArray(I,0),pe=O.TEXTURE_2D_ARRAY):(K.setTexture2D(I,0),pe=O.TEXTURE_2D),E.activeTexture(O.TEXTURE0),E.pixelStorei(O.UNPACK_FLIP_Y_WEBGL,I.flipY),E.pixelStorei(O.UNPACK_PREMULTIPLY_ALPHA_WEBGL,I.premultiplyAlpha),E.pixelStorei(O.UNPACK_ALIGNMENT,I.unpackAlignment);let Ft=E.getParameter(O.UNPACK_ROW_LENGTH),ke=E.getParameter(O.UNPACK_IMAGE_HEIGHT),Zt=E.getParameter(O.UNPACK_SKIP_PIXELS),vn=E.getParameter(O.UNPACK_SKIP_ROWS),Nn=E.getParameter(O.UNPACK_SKIP_IMAGES);E.pixelStorei(O.UNPACK_ROW_LENGTH,st.width),E.pixelStorei(O.UNPACK_IMAGE_HEIGHT,st.height),E.pixelStorei(O.UNPACK_SKIP_PIXELS,Te),E.pixelStorei(O.UNPACK_SKIP_ROWS,De),E.pixelStorei(O.UNPACK_SKIP_IMAGES,Ne);let Er=R.isDataArrayTexture||R.isData3DTexture,Qe=I.isDataArrayTexture||I.isData3DTexture;if(R.isDepthTexture){let gt=V.get(R),On=V.get(I),ot=V.get(gt.__renderTarget),Fn=V.get(On.__renderTarget);E.bindFramebuffer(O.READ_FRAMEBUFFER,ot.__webglFramebuffer),E.bindFramebuffer(O.DRAW_FRAMEBUFFER,Fn.__webglFramebuffer);for(let Mr=0;Mr<ve;Mr++)Er&&(O.framebufferTextureLayer(O.READ_FRAMEBUFFER,O.COLOR_ATTACHMENT0,V.get(R).__webglTexture,k,Ne+Mr),O.framebufferTextureLayer(O.DRAW_FRAMEBUFFER,O.COLOR_ATTACHMENT0,V.get(I).__webglTexture,de,vt+Mr)),O.blitFramebuffer(Te,De,me,ue,Se,Ye,me,ue,O.DEPTH_BUFFER_BIT,O.NEAREST);E.bindFramebuffer(O.READ_FRAMEBUFFER,null),E.bindFramebuffer(O.DRAW_FRAMEBUFFER,null)}else if(k!==0||R.isRenderTargetTexture||V.has(R)){let gt=V.get(R),On=V.get(I);E.bindFramebuffer(O.READ_FRAMEBUFFER,L),E.bindFramebuffer(O.DRAW_FRAMEBUFFER,H);for(let ot=0;ot<ve;ot++)Er?O.framebufferTextureLayer(O.READ_FRAMEBUFFER,O.COLOR_ATTACHMENT0,gt.__webglTexture,k,Ne+ot):O.framebufferTexture2D(O.READ_FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_2D,gt.__webglTexture,k),Qe?O.framebufferTextureLayer(O.DRAW_FRAMEBUFFER,O.COLOR_ATTACHMENT0,On.__webglTexture,de,vt+ot):O.framebufferTexture2D(O.DRAW_FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_2D,On.__webglTexture,de),k!==0?O.blitFramebuffer(Te,De,me,ue,Se,Ye,me,ue,O.COLOR_BUFFER_BIT,O.NEAREST):Qe?O.copyTexSubImage3D(pe,de,Se,Ye,vt+ot,Te,De,me,ue):O.copyTexSubImage2D(pe,de,Se,Ye,Te,De,me,ue);E.bindFramebuffer(O.READ_FRAMEBUFFER,null),E.bindFramebuffer(O.DRAW_FRAMEBUFFER,null)}else Qe?R.isDataTexture||R.isData3DTexture?O.texSubImage3D(pe,de,Se,Ye,vt,me,ue,ve,et,It,st.data):I.isCompressedArrayTexture?O.compressedTexSubImage3D(pe,de,Se,Ye,vt,me,ue,ve,et,st.data):O.texSubImage3D(pe,de,Se,Ye,vt,me,ue,ve,et,It,st):R.isDataTexture?O.texSubImage2D(O.TEXTURE_2D,de,Se,Ye,me,ue,et,It,st.data):R.isCompressedTexture?O.compressedTexSubImage2D(O.TEXTURE_2D,de,Se,Ye,st.width,st.height,et,st.data):O.texSubImage2D(O.TEXTURE_2D,de,Se,Ye,me,ue,et,It,st);E.pixelStorei(O.UNPACK_ROW_LENGTH,Ft),E.pixelStorei(O.UNPACK_IMAGE_HEIGHT,ke),E.pixelStorei(O.UNPACK_SKIP_PIXELS,Zt),E.pixelStorei(O.UNPACK_SKIP_ROWS,vn),E.pixelStorei(O.UNPACK_SKIP_IMAGES,Nn),de===0&&I.generateMipmaps&&O.generateMipmap(pe),E.unbindTexture()},this.initRenderTarget=function(R){V.get(R).__webglFramebuffer===void 0&&K.setupRenderTarget(R)},this.initTexture=function(R){R.isCubeTexture?K.setTextureCube(R,0):R.isData3DTexture?K.setTexture3D(R,0):R.isDataArrayTexture||R.isCompressedArrayTexture?K.setTexture2DArray(R,0):K.setTexture2D(R,0),E.unbindTexture()},this.resetState=function(){z=0,F=0,X=null,E.reset(),he.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return us}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(n){this._outputColorSpace=n;let t=this.getContext();t.drawingBufferColorSpace=ct._getDrawingBufferColorSpace(n),t.unpackColorSpace=ct._getUnpackColorSpace()}};var Bv=120,Gv=.6,Bu=e=>{let n=Rs(pt.fog);return Rs(e).map((t,r)=>t/n[r])},Fu=e=>`vec3(${e.map(n=>n.toFixed(4)).join(", ")})`,kv=Bu(pt.hazeSun),Vv=Bu(pt.hazeShade),Gu=`
vec3 hazeTint( vec3 fogCol, vec3 dir ) {
  float toSun = dot( dir, hazeSunDir ) * 0.5 + 0.5;
  return fogCol * mix( ${Fu(Vv)}, ${Fu(kv)}, toSun * toSun );
}
`,ku="uniform vec3 hazeSunDir;",zv=`
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogRay;
#endif
`,Wv=`
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  // From the camera to here, in world directions (the view's rotation undone).
  vFogRay = ( vec4( mvPosition.xyz, 0.0 ) * viewMatrix ).xyz;
#endif
`;function Xv(){return`
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
  ${ku}
  ${Gu}
#endif
`}var $v=`
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
  float hazeThin = 1.0 - ${Gv.toFixed(3)} * ( 1.0 - exp2( - hazeY / ${Bv.toFixed(1)} ) );
  float hazeD = hazeDensity * hazeThin * hazeDist;
  float fogFactor = 1.0 - exp( - hazeD * hazeD );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, hazeTint( fogColor, hazeDir ), fogFactor );
#endif
`,Si=null;function g1(e){if(!Si){Si=e.clone().normalize(),Ce.fog_pars_vertex=zv,Ce.fog_vertex=Wv,Ce.fog_pars_fragment=Xv(),Ce.fog_fragment=$v;for(let n of[...Object.values(tn??{}).map(t=>t?.uniforms),ce?.fog])n?.fogColor&&(n.hazeSunDir={value:Si.clone()})}}var _1=()=>Si;function v1(){return`${ku}
${Gu}`}var S1=e=>({value:e.clone().normalize()}),x1=.5,Eo=1,Ws=new Set;function E1(e){Eo=e;for(let n of Ws){let t=n.deref();t?t.setHaze(t.times,t.readable):Ws.delete(n)}}var Hu=class e extends ps{constructor(n,t){super(n,t*Eo,t*Eo),this.isHazeFog=!0,this.fair=t,this.times=1,this.readable=1,Ws.add(new WeakRef(this))}setHaze(n,t=1){this.times=n,this.readable=t,this.near=this.fair*n*Eo,this.far=this.fair*Math.min(n,t)*Eo}get density(){return this.near}clone(){return new e(this.color,this.fair)}};var nn=["standard","medium","high","ultra"],Nt={standard:"Very low",medium:"Low",high:"Standard",ultra:"Medium"},Kv={standard:"Standard",medium:"Medium",high:"High",ultra:"Ultra"};function T1(e,n){let t=e?.setting??e?.level;return n||!nn.includes(t)?"":`The graphics settings have new names - your ${Kv[t]} is now called ${Nt[t]}, the same picture. Very low, Low, Standard and Medium today; a new High and Ultra come later.`}var Yv="medium",Xs=nn.at(-1),ir=e=>nn.indexOf(e),Gr=(e,n)=>ir(e)>ir(n),Br=e=>nn.includes(e);function kn(e={}){let n=e&&typeof e=="object"?e:{},t=n.level==="standard"?"standard":n.level===void 0?null:"medium",r=Br(n.highest)?n.highest:Xs,o=Br(n.setting)?n.setting:t??Yv;return Gr(o,r)&&(o=r),{setting:o,highest:r,fixed:n.fixed===!0||n.valve===!1}}function Mo(e,{setting:n,highest:t,fixed:r}){let o={...e&&typeof e=="object"?e:{},setting:n,highest:t===Xs?null:t,fixed:!!r};return o.level=n==="standard"?"standard":"high",o}function To(e,n){let t=kn(e);return Br(n)?Mo(e,{...t,setting:n,highest:Gr(n,t.highest)?n:t.highest}):Mo(e,t)}function b1(e,n){let t=kn(e);return Br(n)?Mo(e,{...t,highest:n,setting:Gr(t.setting,n)?n:t.setting}):Mo(e,t)}function w1(e,n){return Mo(e,{...kn(e),fixed:!!n})}function Vu(e,n=Xs){let t=ir(e);return t<0||t>=ir(n)?nn[0]:nn[t+1]}function zu(e,n){let t=o=>o.first?100:o.of==="effects"?99:o.of==="picture"?-1:ir(o.of),r=o=>o.of==="picture"||o.of==="effects"||o.of!=="standard"&&Br(o.of)&&!Gr(o.of,e);return n.filter(r).sort((o,i)=>t(i)-t(o)||o.order-i.order)}function A1({built:e,steps:n=[],shed:t=0,scale:r=1}){let o=qv({built:e,steps:n,shed:t}),i=n.slice(0,t).some(s=>s.of===o),a=`${Nt[e]??e}${o!==e?` \u2192 ${Nt[o]}`:""}${i?" (reduced)":""}`;return r<1?`${a}, picture ${Math.round(r*100)}%`:a}function qv({built:e,steps:n=[],shed:t=0}){let r=n.slice(0,t),o=e;for(;Gr(o,"medium");){let i=n.filter(a=>a.of===o);if(!i.length||!i.every(a=>r.includes(a)))break;o=nn[ir(o)-1]}return o}function R1(e,n){return e.filter(t=>t.of!=="picture"&&Gr(t.of,n)).length}function y1(e,n){if(!Number.isInteger(n)||n<1||n>e.length)return null;let t=e[n-1];if(t.of==="picture"||!Br(t.of)||e.filter(i=>i.of===t.of).at(-1)!==t)return null;let o=nn[ir(t.of)-1];return o&&o!=="standard"?{upper:t.of,lower:o}:null}function C1({upper:e,lower:n}){return`The graphics keep switching between ${Nt[e]} and ${Nt[n]} on this PC. Make ${Nt[n]} the highest setting?`}function P1({built:e,fixed:n=!1,spent:t=!0,next:r="standard"}){return n?"slow picture":e==="standard"||!t?"":r==="standard"?`G for ${Nt.standard}`:`${Nt.standard} in the menu`}function L1({upper:e,lower:n}){return`Kept switching ${Nt[e]} \u2194 ${Nt[n]}: ${Nt[n]} as the highest setting would suit this PC`}var Zv=1800*1e3;function Wu(e,n=null,t=Date.now(),r=""){let o=e??{},i="",a=new URLSearchParams(r).get("graphics");if(nn.includes(a))o=To(o,a),i=`Started on ${Nt[a]} graphics - G changes it`;else{let l=kn(o),f=n&&typeof n=="object"&&n.setting===l.setting&&Number.isFinite(n.at)&&t-n.at>=0&&t-n.at<Zv,c=nn[nn.indexOf(l.setting)-1];f&&c&&(o={...To(o,c),highest:o?.highest??null},i=`${Nt[l.setting]} didn't finish starting last time on this PC - started on ${Nt[c]}. G to try ${Nt[l.setting]} again`)}let s=kn(o).setting;return{graphics:o,setting:s,changed:o!==e,note:{setting:s,at:t},message:i}}var bo=Wu(Gt("graphics",{}),Gt("startGuard",null),Date.now(),typeof location>"u"?"":location.search);bo.changed&&ao("graphics",bo.graphics);ao("startGuard",bo.note);if(typeof location<"u"&&/[?&]graphics=/.test(location.search)){let e=new URL(location.href);e.searchParams.delete("graphics"),history.replaceState(history.state,"",e)}var H1=bo.message;function B1(){ao("startGuard",null)}var ft=bo.setting,Pe=ft!=="standard",wt=ft==="high"||ft==="ultra",At=ft==="ultra",Ot=typeof window<"u"&&!!window.pocket;function jv(){return kn(Gt("graphics",{}))}function G1(){let e=jv();return Vu(e.setting,e.highest)}function k1(e){ao("graphics",To(Gt("graphics",{}),e)),location.reload()}var xi={ultra:300,high:300,medium:220,standard:150,least:100},$u=20,Qv=.6;function Ku(e,n=Qv){return Object.fromEntries(Object.entries(e).map(([t,r])=>[t,typeof r=="number"?Math.round(r*n):r]))}var $s={ultra:120,high:45},Jv=10,Yu={ultra:120,high:140},qu={ultra:40,high:36},Zu={ultra:!0},ju={ultra:!0,high:!0},Xu={bin:25,band:12};function eS(e,n,{bin:t=Xu.bin,band:r=Xu.band}={}){let o=new Uint8Array(e.length);if(!n?.length||!e.length)return o;let i=e.map(([l,f])=>{let c={d:1/0,s:0,side:1},u=0;for(let d=0;d<Math.max(1,n.length-1);d++){let[h,_]=n[d],[T,p]=n[d+1]??n[d],m=T-h,v=p-_,x=Math.hypot(m,v),g=x>0?Math.max(0,Math.min(1,((l-h)*m+(f-_)*v)/(x*x))):0,M=h+m*g,b=_+v*g,A=Math.hypot(l-M,f-b);A<c.d&&(c={d:A,s:u+x*g,side:m*(f-_)-v*(l-h)>=0?1:-1}),u+=x}return c}),a=new Map,s=(l,f)=>`${l}:${f}`;for(let l of i){let f=s(l.side,Math.floor(l.s/t));a.set(f,Math.min(a.get(f)??1/0,l.d))}return i.forEach((l,f)=>{let c=Math.floor(l.s/t),u=1/0;for(let d of[c-1,c,c+1])u=Math.min(u,a.get(s(l.side,d))??1/0);l.d<=u+r&&(o[f]=1)}),o}var tS=19;function Qu(e,[n,t],r,{distance:o=$s.high,give:i=Jv,front:a=null,frontDistance:s=0,max:l=1/0,always:f=null,ahead:c=null,behind:u=tS}={}){let d=c?.dir?Math.hypot(c.dir[0],c.dir[1]):0,[h,_]=d>1e-6?[c.dir[0]/d,c.dir[1]/d]:[0,0],T=[],p=e.length/2,m=new Uint8Array(p),v=[];for(let x=0;x<p;x++){if(f?.[x]){m[x]=1;continue}let g=Math.hypot(e[x*2]-n,e[x*2+1]-t),M=r[x]===1;if(d>1e-6){let S=(e[x*2]-n)*h+(e[x*2+1]-t)*_;if(M?S<-u-i/2:S<-u+i/2)continue}let b=a?.[x]?Math.max(o,s):o;b>0&&(M?g<=b+i/2:g<b-i/2)&&(m[x]=1,b>o&&!(M?g<=o+i/2:g<o-i/2)&&v.push([g,x]))}if(v.length>l){v.sort((x,g)=>x[0]-g[0]);for(let[,x]of v.slice(Math.max(0,l)))m[x]=0}for(let x=0;x<p;x++)r[x]===1!=(m[x]===1)&&(r[x]=m[x],T.push(x));return T}function Ks(e,{far:n=!1,close:t=!1,boughs:r=!0}={},{nearOnly:o=!1,plain:i=!1,worn:a=!1}={}){return e==="far"?n:n?!1:e==="limbs"||e==="cardsClose"||e==="core"?t:i?!t&&!r:a?e==="cards"?!t&&r:t||r:e==="cards"||o?!t:!0}var Tn={on:{high:!0},sides:6,toward:1,spread:60,reach:3,least:14,cover:.8,near:40,give:10};function Ju(e,{facing:n=null,sides:t=Tn.sides,toward:r=Tn.toward,spread:o=Tn.spread,reach:i=Tn.reach,least:a=Tn.least,cover:s=Tn.cover}={}){let l=e.length/4,f=new Uint8Array(l),c=a;for(let v=0;v<l;v++)c=Math.max(c,e[v*4+3]*i);let u=c,d=new Map,h=(v,x)=>v*73856093+x*19349663;for(let v=0;v<l;v++){let x=h(Math.floor(e[v*4]/u),Math.floor(e[v*4+1]/u));d.has(x)?d.get(x).push(v):d.set(x,[v])}let _=n?.length?n:null,T=o*Math.PI/180,p=_?r:t,m=_?eS(Array.from({length:l},(v,x)=>[e[x*4],e[x*4+1]]),_):null;for(let v=0;v<l;v++){if(m?.[v])continue;let[x,g,M,b]=[e[v*4],e[v*4+1],e[v*4+2],e[v*4+3]],A=Math.max(a,b*i),S=_?nS(x,g,_):null,w=S?Math.atan2(S[1]-g,S[0]-x):0;if(S&&Math.hypot(S[0]-x,S[1]-g)<1e-6)continue;let y=new Uint8Array(p),P=0,D=Math.floor(x/u),U=Math.floor(g/u);for(let L=D-1;L<=D+1&&P<p;L++)for(let H=U-1;H<=U+1&&P<p;H++)for(let z of d.get(h(L,H))??[]){if(z===v||e[z*4+2]<M*s)continue;let F=e[z*4]-x,X=e[z*4+1]-g,$=Math.hypot(F,X);if($>A||$===0)continue;let j;if(_){let Z=Math.atan2(Math.sin(Math.atan2(X,F)-w),Math.cos(Math.atan2(X,F)-w));if(Math.abs(Z)>T)continue;j=Math.min(p-1,Math.floor((Z+T)/(2*T)*p))}else j=Math.floor((Math.atan2(X,F)+Math.PI)/(Math.PI*2)*t)%t;y[j]||(y[j]=1,P++)}P===p&&(f[v]=1)}return f}function nS(e,n,t){let r=null,o=1/0;for(let i=0;i<t.length;i++){let[a,s]=t[i],[l,f]=t[i+1]??t[i],c=l-a,u=f-s,d=c*c+u*u,h=d>0?Math.max(0,Math.min(1,((e-a)*c+(n-s)*u)/d)):0,_=a+c*h,T=s+u*h,p=(e-_)**2+(n-T)**2;p<o&&([r,o]=[[_,T],p])}return r}function ed(e,n,t,r,{near:o=Tn.near,give:i=Tn.give}={}){let a=[];n=(n??[]).filter(l=>l?.length);let s=e.length/2;for(let l=0;l<s;l++){if(!t[l])continue;let f=1/0;for(let d of n)f=Math.min(f,td(e[l*2],e[l*2+1],d));let c=r[l]===1,u=c?f<=o+i/2:f<o-i/2;u!==c&&(r[l]=u?1:0,a.push(l))}return a}function td(e,n,t){let r=1/0;for(let o=0;o<t.length;o++){let[i,a]=t[o],s=t[o+1],l;if(!s)l=(e-i)**2+(n-a)**2;else{let[f,c]=s,u=f-i,d=c-a,h=u*u+d*d,_=h>0?Math.max(0,Math.min(1,((e-i)*u+(n-a)*d)/h)):0;l=(e-i-u*_)**2+(n-a-d*_)**2}l<r&&(r=l)}return Math.sqrt(r)}function nd(e,n,t,{distance:r=xi.medium,hysteresis:o=$u,never:i=null}={}){let a=[];if(n=(n??[]).filter(c=>c?.length),!n.length)return a;let s=r+o/2,l=r-o/2,f=e.length/2;for(let c=0;c<f;c++){let u=t[c]===1,d=!1;if(!i?.[c]){let h=1/0;for(let _ of n)h=Math.min(h,td(e[c*2],e[c*2+1],_));d=u?h>=l:h>s}d!==u&&(t[c]=d?1:0,a.push(c))}return a}function rd(e,n,t,r,{distance:o=xi.medium,hysteresis:i=$u}={}){let a=o-i,s=a*a,l=e.length/2;for(let f=0;f<l;f++){if(n[f]!==1)continue;let c=e[f*2]-t,u=e[f*2+1]-r;if(c*c+u*u<s)return!0}return!1}function od({cut:e=!1,newPlan:n=!1,tooClose:t=!1}={}){return e||n||t}function Ys(e,n){return n?.length?Array.isArray(n[0]?.[0])?[[e],...n]:[[e],n]:[[e]]}var qs={bark:{full:14,fade:28,depth:.05,cracks:.55,lean:1.3},leaves:{full:45,fade:72,through:.08,behind:.05,glint:.04,shade:.4}};var kr=[{id:"grade",label:"Warm colour and vignette",cost:"light",help:"A slightly warmer colour over the whole picture with a little more contrast, and the corners a touch darker, as a camera sees it."},{id:"ao",label:"Ambient occlusion",cost:"heavy",step:"ambient occlusion",heavy:!0,help:"A soft shade where things meet the ground near you - the foot of a trunk, under a bunker's lip, along a wall - so they sit in it rather than float."},{id:"fxaa",label:"Smooth edges (FXAA)",cost:"light",help:"Smooths the jagged edges the picture's own smoothing misses: leaves, grass blades, thin flag poles."},{id:"sharpen",label:"Sharper picture",cost:"light",costWhen:"with any other of the picture's effects on",help:"The picture's fine detail - grass blades, leaves, the far tree line - brought back where smoothing softens it, most on the highest setting, whose picture is built up over time. Edges that are sharp already are left alone, and so is the sky."},{id:"bloom",label:"Bloom",cost:"some",step:"bloom",heavy:!0,help:"A soft glow round only the very brightest things - sun on water, the white of the ball in sunlight. Held back: nothing else glows."},{id:"sky",label:"Detailed sky",cost:"light",help:"High, thin wisps of cloud across the sky above the cumulus, and the full number of clouds. Off: a plain sky with fewer clouds."},{id:"haze",label:"Distance haze",cost:"none",help:"The air's haze, so far hills and woods fade into the sky. Off: a clearer day, the haze only right at the edge of the world."},{id:"textures",label:"Sharp ground textures",cost:"some",costWhen:"and more of the graphics card's memory",reload:!0,notOn:["standard"],help:"Grass blades and sand grains you can see on the ground near the ball, as Standard has, on Low too. A\xB2 Golf reloads to change it."},{id:"dof",label:"Blur the far distance",cost:"some",step:"the far blur",heavy:!0,help:"The far hills and woods, beyond any green, softly out of focus, as a camera focused on the hole sees them."},{id:"shafts",label:"Sun shafts and glow",cost:"heavy",costWhen:"when the sun's in the picture",step:"sun shafts",heavy:!0,notOn:["standard","medium","high"],help:"On Medium (the highest setting): rays of sunlight streaming through the leaves and round the trunks when the sun's in the picture, and a wider, softer glow round the sun's glints on water."},{id:"focus",label:"Flyover depth of field",cost:"heavy",costWhen:"only in a hole's flyover - nothing while you play",step:"flyover depth of field",heavy:!0,notOn:["standard","medium","high"],help:"On Medium (the highest setting): in a hole's flyover the camera focuses on the ball, as a film camera's would: the ball, the trees along the hole and the green ahead stay sharp, and only the grass right by the camera and the far distance go softly out of focus. Never while you're playing a shot."},{id:"taa",label:"Smooth edges over time (TAA)",cost:"some",costWhen:"in place of FXAA's",step:"smoothing over time",notOn:["standard","medium","high"],help:"On Medium (the highest setting): each frame's drawn a fraction of a pixel to one side and blended with the last few, so leaves, flag poles and far mowing stripes are smooth and never crawl. In place of FXAA while it's on."},{id:"upscale",label:"Fewer pixels, built up over time",cost:"saves",costWhen:"with Smooth edges over time on",notOn:["standard","medium","high"],help:"On Medium (the highest setting), with Smooth edges over time: the picture drawn at two-thirds of its size each way and the full-size one built up from the last few frames, each nudged a fraction of a pixel - nearly as sharp, at under half the drawing. Off: every pixel drawn every frame."},{id:"sway",label:"Camera sway",cost:"none",help:"The camera breathes very slightly, as if held, rather than standing dead still. It never moves the aim line enough to see."},{id:"evening",label:"Late-afternoon light",cost:"none",reload:!0,help:"A lower, warmer sun on the practice greens and in the Challenges: golden light, longer shadows, a warmer sky (a round and the range take their own Time of day, picked with the sky). Off: the sun higher, in the middle of the day. A\xB2 Golf reloads to change it."},{id:"hardsun",label:"Harder sunlight",cost:"none",reload:!0,help:"The sun stronger and the sky's light softer, as on a clear day: shade under a third as bright as the sun rather than half, so trees, slopes and bunker faces stand out (less so as the sun gets low, so an evening round isn't dark). Off: the softer, flatter light the game had. A\xB2 Golf reloads to change it."},{id:"grassfield",label:"Grass all over the hole",cost:"heavy",costWhen:"and a longer wait while each hole's built",reload:!0,notOn:["standard"],help:"Tufts of longer grass all over every hole's rough and long grass, as thick far out as by the ball, see-through round the ball so you can always find it. Off: tufts only by the tee and round the green. A\xB2 Golf reloads to change it."},{id:"fineleaves",label:"Finer leaves",cost:"some",costWhen:"with trees near you, and a moment longer to start",reload:!0,notOn:["standard","medium"],help:"On Standard and Medium: the trees near you drawn with more, smaller leaves - their crowns, boughs and pine sprays - so a tree close by reads as leaves, not as cards of them. Off: fewer, larger cards, as before. A\xB2 Golf reloads to change it."},{id:"leafshare",label:"Fewer leaves on far trees",cost:"spares",costWhen:"the more trees there are down the hole",notOn:["standard","medium"],help:"On Standard and Medium: a tree well down the hole is drawn with a share of its leaves - all of them within 60 m, a third by 250 m - each a little bigger, so it's as full as ever for far fewer triangles (most on Medium, where every tree of the hole is drawn at its best). Its leaves fill in a few at a time as the camera comes to it, each from nothing: no tree is swapped for another. Off: every leaf of every tree, however far."},{id:"clock",label:"Time of day from the clock",cost:"none",reload:!0,help:"The sun where it would be at this time of day on the practice greens and in the Challenges: low and soft in the morning, high at midday, low and golden in the evening (a round and the range take their own Time of day, picked with the sky). In place of Late-afternoon light while it's on. A\xB2 Golf reloads to change it."},{id:"seasons",label:"Seasons",cost:"none",reload:!0,help:"The course in today's season: fresher, lighter greens in spring, the usual deep green in summer, golds, coppers and reds in the broadleaves in autumn, duller grass and dead brown leaves in winter. A\xB2 Golf reloads to change it."},{id:"rainground",label:"Rain on the ground",cost:"some",costWhen:"only while it rains",notOn:["standard"],help:"While it rains, drops splashing on the grass all round you, and rings spreading on the puddles. (Ponds ring in the rain either way.)"},{id:"wetshine",label:"Reflections on wet ground",cost:"light",costWhen:"only after rain",reload:!0,notOn:["standard"],help:"After rain the grass and paths shine with the sky's light, most where you look along them. A\xB2 Golf reloads to change it."}],Zs=kr.map(e=>e.id),W1=Object.fromEntries(kr.filter(e=>e.step).map(e=>[e.id,e.step])),rS={saves:"less than nothing: it saves more than half the picture's drawing",spares:"less than nothing: it spares a third or more of the trees' leaves from being drawn",none:"next to nothing (only the colours or the light change)",light:"light, about 1 to 3% of each frame",some:"some, about 4 to 8% of each frame",heavy:"heavy, about 10 to 20% of each frame"};function X1(e,n=[]){let t=kr.find(i=>i.id===e);if(!t?.cost)return"";let r=`Typical cost: ${rS[t.cost]}${t.costWhen?`, ${t.costWhen}`:""}.`,o=t.step?oS(n,t.step):null;return o?`${r} Measured here: ${o.ms} ms a frame (${Math.round(o.share*100)}%) at Medium's slowest moment (the highest setting).`:r}function oS(e,n){for(let t of Array.isArray(e)?e:[])for(let r of t?.results??[]){let o=r?.costs?.find(i=>i.name===n);if(o&&Number.isFinite(o.ms))return o}return null}var id=Object.fromEntries(kr.map(e=>[e.id,e])),ad=typeof globalThis<"u"&&!!globalThis.pocket,iS=["textures","grassfield","fineleaves","wetshine"],js=["default","performance"],$1={default:"Default",performance:"Performance",custom:"Your own"};function Qs(e,n=ad){return Object.fromEntries(kr.map(t=>[t.id,e==="performance"?!t.heavy&&!(n&&iS.includes(t.id)):!0]))}var aS=(e,n=ad)=>n||e==="standard"?"performance":"default";function sd(e,n=null){let t=Zs.filter(r=>!n||ld(r,n));return js.find(r=>t.every(o=>!!e[o]===Qs(r)[o]))??"custom"}function Js(e,n="medium"){let t=e&&typeof e=="object"?e:{},r=Qs(js.includes(t.preset)?t.preset:aS(n)),o=t.on&&typeof t.on=="object"?t.on:{},i=Object.fromEntries(Zs.map(a=>[a,typeof o[a]=="boolean"?o[a]:r[a]]));return{on:i,preset:sd(i,n)}}var Ei=(e,n=null)=>({on:{...e},preset:sd(e,n)});function K1(e,n,t,r){let{on:o}=Js(e,r);return n in id?Ei({...o,[n]:!!t},r):Ei(o,r)}function Y1(e,n,t){return js.includes(n)?Ei(Qs(n),t):Ei(Js(e,t).on,t)}function q1(e,n){return kr.some(t=>t.reload&&!!e?.[t.id]!=!!n?.[t.id])}var ld=(e,n)=>!(id[e]?.notOn??[]).includes(n);function Pn(e,n){let{on:t}=Js(e,n);return Object.fromEntries(Zs.map(r=>[r,t[r]&&ld(r,n)]))}var sS=["grade","ao","fxaa","bloom","dof","shafts","focus","taa"],Z1=e=>sS.some(n=>e?.[n]);var ud="cs2",tl=2600,nl=64;function lS(e=nl,n=8,t=11){let r=t,o=()=>(r=r*16807%2147483647)/2147483647,i=Array.from({length:n*n},o),a=(f,c)=>i[(c+n)%n*n+(f+n)%n],s=new Uint8Array(e*e),l=f=>f*f*(3-2*f);for(let f=0;f<e;f++)for(let c=0;c<e;c++){let u=c/e*n,d=f/e*n,h=Math.floor(u),_=Math.floor(d),T=l(u-h),p=l(d-_),m=a(h,_)+(a(h+1,_)-a(h,_))*T,v=a(h,_+1)+(a(h+1,_+1)-a(h,_+1))*T;s[f*e+c]=Math.round((m+(v-m)*p)*255)}return s}function cS(){let e=new Gn(lS(),nl,nl,Jo,$t);return e.wrapS=e.wrapT=fn,e.magFilter=St,e.minFilter=Xt,e.generateMipmaps=!0,e.needsUpdate=!0,e}var el=ru({hard:Pn(Gt("effects",{}),ft).hardsun}),fS=el.sun*Math.sin(As*Math.PI/180)/(el.sun*Math.sin(As*Math.PI/180)+el.sky),Mi={csMap:{value:cS()},csDrift:{value:new je},csStrength:{value:0},csLo:{value:.5}},cd=`
uniform sampler2D csMap;
uniform vec2 csDrift;
uniform float csStrength;
uniform float csLo;
`,fd=`
if ( csStrength > 0.0 ) {
  float csN = texture2D( csMap, ( csWorld.xz - csDrift ) / ${tl.toFixed(1)} ).r;
  float csShade = smoothstep( csLo, csLo + 0.2, csN ) * min( 0.95, csStrength / ${fS.toFixed(4)} );
  reflectedLight.directDiffuse *= 1.0 - csShade;
  reflectedLight.directSpecular *= 1.0 - csShade;
}
`,dd=new Set;function nA(e){return dd.add(e),e}function rA(e,[n,t],r){let o=Mi.csDrift.value;o.x=(o.x+n*e)%tl,o.y=(o.y+t*e)%tl,Mi.csStrength.value=r;for(let i of dd)i(Mi)}function hd(e){return Object.assign(e.uniforms,Mi),!fd&&!cd||(e.vertexShader=e.vertexShader.replace("#include <common>",`#include <common>
varying vec3 csWorld;`).replace("#include <project_vertex>",`#include <project_vertex>
csWorld = (vec4(mvPosition.xyz, 0.0) * viewMatrix).xyz + cameraPosition;`),e.fragmentShader=e.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 csWorld;
${cd}`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
${fd}`)),e}function pd(e,n=!1){return n||!(e>0)?0:Math.min(1,e/28)}var Ti=[],Ln=[],Vn=0;function dn(e,n,t,{of:r="medium",first:o=!1}={}){let i=Ti.findIndex(a=>a.name===n);i>=0&&Ti.splice(i,1),Ti.push({order:e,name:n,apply:t,of:r,first:o}),Ln=zu(ft,Ti)}function uS(){return Ln.length}function lA(){return Ln.map(({name:e,of:n,order:t,first:r})=>({name:e,of:n,order:t,first:r}))}function cA(){return Vn}function fA(){return Ln.slice(0,Vn).map(e=>e.name)}function uA(e){for(e=Math.max(0,Math.min(uS(),e));Vn<e;)Ln[Vn++].apply(!0);for(;Vn>e;)Ln[--Vn].apply(!1)}function rl(e){return Ln.slice(0,Vn).some(n=>n.name===e)}function dA(e,n){let t=Ln.findIndex(r=>r.name===e);return t<0||t<Vn?!1:(Ln[t].apply(!!n),!0)}var _d="b1",vd={bendTime:{value:0},bendDir:{value:new je(1,0)},bendStrength:{value:0},bendSpeed:{value:2},bendFlutter:{value:Pe?1:0}},Vr=e=>Number.isInteger(e)?`${e}.0`:`${e}`,gS=`
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
`,Sd=`
  #if defined( USE_BATCHING )
    mat4 bM = modelMatrix * batchingMatrix;
  #elif defined( USE_INSTANCING )
    mat4 bM = modelMatrix * instanceMatrix;
  #else
    mat4 bM = modelMatrix;
  #endif`,bi=(e="")=>`
{
  ${Sd}
  vec3 bFoot = (bM * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float bH = length(bM[1].xyz) * ${Vr(10)};
  float bY = max(0.0, (bM * vec4(transformed, 1.0)).y - bFoot.y);
  float bT = clamp(bY / bH, 0.0, 1.0);
  vec3 bPush = vec3(bendDir.x, 0.0, bendDir.y) * (bendWave(bFoot, 1.25) * ${Vr(.02)} * bH * bT * bT);
  ${e}
  transformed += inverse(mat3(bM)) * bPush;
}
`,_S=`
  float bF = bendHash(transformed.xz * 3.7 + transformed.y);
  bPush += vec3(sin(bendTime * 7.0 + bF * 6.2831853), 0.6 * sin(bendTime * 5.3 + bF * 12.0), cos(bendTime * 6.1 + bF * 9.0)) * (0.05 * bendStrength * bendFlutter);
`,vS=`
  float bHang = clamp(1.0 - bY / (bH * 0.6), 0.0, 1.0);
  bPush += vec3(bendDir.x, 0.0, bendDir.y) * (bendStrength * bHang * 0.35 * (0.6 + 0.4 * sin(bendTime * 1.7 + bendHash(bFoot.xz) * 6.2831853)));
`,gd=`
{
  ${Sd}
  vec3 bFoot = (bM * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float bY = max(0.0, transformed.y) * length(bM[1].xyz);
  float bRipple = 1.0 + 0.25 * sin(bendTime * 4.3 + bendHash(bFoot.xz) * 6.2831853 + transformed.x * 3.0);
  vec3 bPush = vec3(bendDir.x, 0.0, bendDir.y) * (bendWave(bFoot, 2.1) * bRipple * ${Vr(.1)} * bY * bY);
  transformed += inverse(mat3(bM)) * bPush;
}
`,ol={trunk:bi(),crown:bi(),cards:bi(_S),strands:bi(vS),tuft:gd,dressing:gd};function xd(e,n){let t=ol[n]??"";return t&&(Object.assign(e.uniforms,vd),e.vertexShader=e.vertexShader.replace("#include <common>",`#include <common>
${gS}`).replace("#include <begin_vertex>",`#include <begin_vertex>
${t}`)),e}var Ed=!1;dn(4,"leaf flutter",e=>{Ed=e});var Md=new Set;function _A(e){return Md.add(e),e}function vA(e){let n=vd;n.bendTime.value=e.time,n.bendDir.value.set(e.dir[0],e.dir[1]),n.bendStrength.value=pd(e.gusting,e.still),n.bendSpeed.value=Math.max(2,(e.mph??0)*.447),n.bendFlutter.value=Pe&&!Ed?1:0;for(let t of Md)t(n);return n}var Td={trunk:{near:2,far:5,least:.25},leaves:{near:.5,far:1.5,least:0}};var SS=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];var zr=e=>Number.isInteger(e)?`${e}.0`:`${e}`;function bd(e){return`{
    float stD = length(vViewPosition);
    if (stD < ${zr(e.far)}) {
      float stT = clamp((stD - ${zr(e.near)}) / ${zr(e.far-e.near)}, 0.0, 1.0);
      float stCover = ${zr(e.least)} + ${zr(1-e.least)} * stT * stT * (3.0 - 2.0 * stT);
      const float stBayer[16] = float[16](${SS.map(zr).join(", ")});
      ivec2 stP = ivec2(gl_FragCoord.xy) & 3;
      if (stCover <= (stBayer[stP.y * 4 + stP.x] + 0.5) / 16.0) discard;
    }
  }`}var xS={amount:.1,size:7,warm:[1.1,1,.6],spread:[.45,1.55],sizes:[.7,1.4]},wd="tp2",ES=new Set(["crown","cards","strands"]),hn=e=>Number.isInteger(e)?`${e}.0`:`${e}`,MS=`
  #if defined( USE_BATCHING )
    mat4 pM = modelMatrix * getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
  #elif defined( USE_INSTANCING )
    mat4 pM = modelMatrix * instanceMatrix;
  #else
    mat4 pM = modelMatrix;
  #endif`,TS="sin(p.x * k + s * 6.2832) * sin(p.y * k * 0.8 + s * 11.0) * sin(p.z * k + s * 17.0)",wi={amount:[7.13,.37],size:[3.71,.61]};function Ad(e,n){if(!ES.has(n)||!ol[n])return e;let t=xS;return e.vertexShader=e.vertexShader.replace("#include <project_vertex>",`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
    {
      ${MS}
      vec3 pFoot = (pM * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      float s = fract(sin(dot(floor(pFoot.xz * 4.0), vec2(12.9898, 78.233))) * 43758.5453);
      vec3 p = position;
      float pA = fract(s * ${hn(wi.amount[0])} + ${hn(wi.amount[1])});
      float pS = fract(s * ${hn(wi.size[0])} + ${hn(wi.size[1])});
      float k = ${hn(2*Math.PI/t.size)} / mix(${hn(t.sizes[0])}, ${hn(t.sizes[1])}, pS);
      float pv = ${TS};
      vColor.rgb *= vec3(1.0) + ${hn(t.amount)} * mix(${hn(t.spread[0])}, ${hn(t.spread[1])}, pA) * pv * vec3(${t.warm.map(hn).join(", ")});
    }
    #endif
    #include <project_vertex>`),e}var wo={sheen:.45,power:4,tint:[1,.97,.84],body:.12},Rd=["ground","tuft","tuftnear","tuftfar","longgrass","nest"];var yd="gl1",bS=new Set(Rd),wS=e=>bS.has(e),AS={glK:{value:new te(wo.sheen,wo.power,wo.body)},glTint:{value:new te(...wo.tint)}},wA={value:new te(0,1,0)},RS=`
uniform vec3 glK;
uniform vec3 glTint;
float glGrass = 1.0;
`,yS=`
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
`;function Cd(e,n){return wS(n)&&(Object.assign(e.uniforms,AS),e.fragmentShader=e.fragmentShader.replace("#include <common>",`#include <common>
${RS}`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
${yS}`)),e}var zt={full:60,least:250,share:.3,fade:.06,step:2,give:1,reach:4},CS=e=>{let n=Math.min(1,Math.max(0,e));return n*n*(3-2*n)};function PS(e,n=zt){return 1-(1-n.share)*CS((e-n.full)/Math.max(1,n.least-n.full))}function Pd(e,n,t=zt){let r=PS(Math.max(0,e-t.step-t.give),t);return Math.min(n,Math.floor((r+t.fade)*n)+2)}function Ld(e){let n=e.length;if(n<=2)return Array.from({length:n},(f,c)=>c);let t=[1/0,1/0,1/0],r=[-1/0,-1/0,-1/0];for(let f of e)for(let c=0;c<3;c++)t[c]=Math.min(t[c],f[c]),r[c]=Math.max(r[c],f[c]);let o=f=>{let c=f&1023;return c=(c|c<<16)&50331903,c=(c|c<<8)&50393103,c=(c|c<<4)&51130563,c=(c|c<<2)&153391689,c},i=e.map(f=>{let c=[0,1,2].map(u=>Math.min(1023,Math.floor((f[u]-t[u])/(r[u]-t[u]||1)*1024)));return o(c[0])+o(c[1])*2+o(c[2])*4}),a=Array.from({length:n},(f,c)=>c).sort((f,c)=>i[f]-i[c]||f-c),s=0;for(;1<<s<n;)s++;let l=[];for(let f=0;f<1<<s;f++){let c=0;for(let u=0;u<s;u++)f&1<<u&&(c|=1<<s-1-u);c<n&&l.push(a[c])}return l}function Dd(e,n){let t=new Int32Array(n);for(let l=0;l<n;l++)t[l]=l;let r=l=>{for(;t[l]!==l;)t[l]=t[t[l]],l=t[l];return l},o=(l,f)=>{let c=r(l),u=r(f);c!==u&&(t[u]=c)};for(let l=0;l+2<e.length;l+=3)o(e[l],e[l+1]),o(e[l],e[l+2]);let i=new Int32Array(n).fill(-1),a=[];for(let l=0;l+2<e.length;l+=3){let f=r(e[l]);i[f]<0&&(i[f]=a.length,a.push([])),a[i[f]].push(l)}let s=new Int32Array(n);for(let l=0;l<n;l++)s[l]=i[r(l)];return{units:a.length,unitOf:s,triangles:a}}var Ud="ls1",il=e=>Number.isInteger(e)?`${e}.0`:`${e}`,Ri={leafEye:{value:new te},leafShareK:{value:new Pt(zt.full,zt.least,zt.share,1)}},LS=`
attribute vec4 leafPart;
uniform vec3 leafEye;
uniform vec4 leafShareK;
`,DS=`
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
`;function Id(e,n){return n!=="cards"||(Object.assign(e.uniforms,Ri),e.vertexShader=e.vertexShader.replace("#include <common>",`#include <common>
${LS}`).replace("#include <begin_vertex>",`#include <begin_vertex>
${DS}`)),e}var Ai=!0,al=1;function CA(e){Ai!==!!e&&(Ai=!!e,Ri.leafShareK.value.w=Ai?1:0,al++)}function Nd(e){e?.position&&Ri.leafEye.value.copy(e.position)}function sl(e){let n=e?.index,t=e?.attributes?.position;if(!n||!t||!n.count||e.userData.leafEnds)return e;let r=t.count,o=n.array,{units:i,unitOf:a,triangles:s}=Dd(o,r),l=new Float64Array(i*3),f=new Uint32Array(i);for(let v=0;v<r;v++){let x=a[v];x<0||(l[x*3]+=t.getX(v),l[x*3+1]+=t.getY(v),l[x*3+2]+=t.getZ(v),f[x]++)}let c=Array.from({length:i},(v,x)=>[l[x*3]/f[x],l[x*3+1]/f[x],l[x*3+2]/f[x]]),u=Ld(c),d=new o.constructor(o.length),h=new Uint32Array(i+1),_=new Float32Array(i),T=0;u.forEach((v,x)=>{_[v]=x/i;for(let g of s[v])d[T++]=o[g],d[T++]=o[g+1],d[T++]=o[g+2];h[x+1]=T}),o.set(d),n.needsUpdate=!0;let p=new Int16Array(r*4),m=v=>Math.round(Math.max(-1,Math.min(1,v))*32767);for(let v=0;v<r;v++){let x=a[v];x<0||(p[v*4]=m((t.getX(v)-c[x][0])/zt.reach),p[v*4+1]=m((t.getY(v)-c[x][1])/zt.reach),p[v*4+2]=m((t.getZ(v)-c[x][2])/zt.reach),p[v*4+3]=m(_[x]))}return e.setAttribute("leafPart",new Oe(p,4,!0)),e.userData.leafEnds=h,e}function ll(e){let n=e?.attributes?.position?.count??0;return e&&e.attributes.leafPart?.count!==n&&e.setAttribute("leafPart",new Oe(new Int16Array(n*4),4,!0)),e}function Od(e,n){if(!n.length||e.userData.leaves)return;let t=n.length,r=n.reduce((h,_)=>Math.max(h,_.id),0)+1,o=new Uint32Array(r),i=new Uint32Array(r),a=new Float32Array(t*3),s=new Uint32Array(t),l=n.map(h=>h.ends);n.forEach((h,_)=>{a.set([h.x,h.y,h.z],_*3),s[_]=h.id,o[h.id]=i[h.id]=h.ends[h.ends.length-1]});let f={trees:n,whole:o,sent:i,at:new te(1/0,0,0),stamp:0,shadow:!1,listed:!1,counted:0};e.userData.leaves=f;let c=(h,_)=>{let[T,p,m,v,x,g]=[h[0],h[2],h[4],h[6],h[8],h[10]],M=h[12]-_.x,b=h[14]-_.z;for(let A=0,S=0;A<t;A++,S+=3){let w=a[S],y=a[S+1],P=a[S+2],D=T*w+m*y+x*P+M,U=p*w+v*y+g*P+b,L=l[A];i[s[A]]=L[Pd(Math.sqrt(D*D+U*U),L.length-1)]}f.counted++},u=e.onBeforeRender;e.onBeforeRender=function(h,_,T,p,m,...v){let x=this._visibilityChanged||this.perObjectFrustumCulled||this.sortObjects;if(u.call(this,h,_,T,p,m,...v),h?.isWebGPURenderer||m?.wireframe)return;x&&(f.listed=!1);let g=this._multiDrawCounts,M=this._indirectTexture?.image?.data;if(!g||!M)return;let b=Ai&&!f.shadow,A=!1;if(b){let w=Ri.leafEye.value;if((f.stamp!==al||w.distanceToSquared(f.at)>zt.step*zt.step)&&(f.stamp=al,f.at.copy(w),c(this.matrixWorld.elements,w),A=!0),f.listed&&!A)return}else if(!f.listed)return;let S=b?i:o;for(let w=0,y=this._multiDrawCount;w<y;w++){let P=M[w];P<r&&o[P]&&(g[w]=S[P])}f.listed=b};let d=e.onBeforeShadow;e.onBeforeShadow=function(...h){f.shadow=!0;try{d.apply(this,h)}finally{f.shadow=!1}}}var kd="/textures/",cl=["furrowed","plates","birch","plane"],Dn=Object.fromEntries(cl.map((e,n)=>[e,n])),fl=["asphalt","concrete","gravel","wood","brick"],DA=Object.fromEntries(fl.map((e,n)=>[e,n])),Vd=[191,128,128,255];function Fd(){let e=new Gn(new Uint8Array(Vd),1,1);return e.needsUpdate=!0,e}function Hd(e){let n=new Uint8Array(4*e);for(let r=0;r<e;r++)n.set(Vd,r*4);let t=new Ur(n,1,1,e);return t.needsUpdate=!0,t}var bn={tGrass:{value:null},tSand:{value:null},tBark:{value:null},tBuilt:{value:null}};function zd(e){return e.wrapS=e.wrapT=fn,e.anisotropy=wt?16:8,e.colorSpace=un,e.generateMipmaps=!0,e.minFilter=Xt,e.magFilter=St,e.needsUpdate=!0,e}var Bd=!1,ul=[];function Ao(){if(Bd||(Bd=!0,bn.tGrass.value=Fd(),bn.tSand.value=Fd(),bn.tBark.value=Hd(cl.length),bn.tBuilt.value=Hd(fl.length),typeof document>"u"||typeof Image>"u"))return bn;let e=new Es;for(let[n,t]of Ot?[["grass","tGrass"]]:[["grass","tGrass"],["sand","tSand"]])ul.push(new Promise(r=>e.load(`${kd}${n}.png`,o=>{bn[t].value=zd(o),r()},void 0,()=>{console.warn(`Couldn't load the ${n} texture: the shader's own detail stays`),r()})));return Gd("bark",cl,"tBark","the trunks stay plain"),Gd("built",fl,"tBuilt","paths and walls keep their shader's own detail"),bn}function Gd(e,n,t,r){let o=n.map(a=>{let s=new Image;return s.src=`${kd}${e}-${a}.png`,s.decode().then(()=>s)}),i=Promise.all(o).then(a=>{let s=a[0].naturalWidth,l=document.createElement("canvas");l.width=l.height=s;let f=l.getContext("2d",{willReadFrequently:!0}),c=new Uint8Array(s*s*4*a.length);a.forEach((d,h)=>{f.clearRect(0,0,s,s),f.drawImage(d,0,0,s,s),c.set(f.getImageData(0,0,s,s).data,h*s*s*4)});let u=new Ur(c,s,s,a.length);bn[t].value=zd(u)}).catch(()=>console.warn(`Couldn't load the ${e} textures: ${r}`));ul.push(i)}function UA(){return Promise.all(ul).then(()=>Object.values(bn).map(e=>e.value).filter(Boolean))}var IA=`
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
`;var Wd="gr13",US="vec3(0.8, 0.95, 1.02)",Wr={gWindDir:{value:[1,0]},gWindOff:{value:0},gWindK:{value:0},gWet:{value:0},gDry:{value:0},gRain:{value:0},gTime:{value:0},gFarRough:{value:[0,1,2,3]},gFarRoughK:{value:0}},IS={on:!0},NS=`
  uniform vec2 gWindDir;
  uniform float gWindOff;
  uniform float gWindK;
  uniform float gWet;
  uniform float gDry;
  uniform float gRain;
  uniform float gTime;
  uniform vec4 gFarRough;
  uniform float gFarRoughK;
`;function OS(e){let n=hl(e?.wet),t=hl(e?.dry)*(1-n);if(!e||e.still)return{wind:0,speed:0,dir:[1,0],wet:n,dry:t};let r=Math.max(0,e.mph??0),o=Math.min(1,Math.max(0,(r-3)/17)),i=Math.max(.6,Math.min(1.4,1+((e.gust??1)-1)*1.3)),a=Math.min(1,o*i),s=Math.max(0,e.gusting??r)*.447*.65;return{wind:a,speed:s,dir:e.dir??[1,0],wet:n,dry:t}}var hl=e=>Number.isFinite(e)?Math.min(1,Math.max(0,e)):0,dl=null;function GA(e,n){let t=dl===null?0:Math.min(.25,Math.max(0,e-dl));dl=e;let r=OS(n),o=Wr;o.gWindDir.value=r.dir,o.gWindOff.value+=r.speed*t,o.gWindK.value+=(r.wind-o.gWindK.value)*Math.min(1,t*1.2),o.gWindK.value<.002&&r.wind===0&&(o.gWindK.value=0),o.gWet.value=r.wet,o.gDry.value=r.dry,o.gRain.value=IS.on?hl(n?.rain):0,o.gTime.value=e%600;for(let i of Xd)i(o);return r}var Xd=new Set;function kA(e){return Xd.add(e),e}var $d=([e,n])=>[n,-e],Kd=`
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
    grass = mix(grass, grass * ${US}, min(k, 1.0) * clover);
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
`,FS=`
  ${NS}
  const vec3 G_STRAW = ${go(pt.straw)};
  const float G_WET = ${ou.toFixed(4)};
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
`,Yd=`
  ${FS}

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
`;function qd(e,n=.7){return`
    {
      vec3 lx = (viewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz;
      vec3 lz = (viewMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz;
      lx = normalize(lx - normal * dot(normal, lx));
      lz = normalize(lz - normal * dot(normal, lz));
      normal = normalize(normal + (lx * ${e}.x + lz * ${e}.y) * ${n.toFixed(3)});
    }`}var VA="co3",zA=`
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
`;var Zd="st1";function jd(e,n){let t=Td[n];return t&&(e.fragmentShader=e.fragmentShader.replace("#include <alphatest_fragment>",`#include <alphatest_fragment>
${bd(t)}`)),e}var Qd=!1;function YA(e){Qd=!!e}var HS=0;function rn(e,n,t={}){if(e.userData.twin={kind:n,options:t},Qd){let r=++HS,o=Object.prototype.hasOwnProperty.call(e,"customProgramCacheKey")?e.customProgramCacheKey:null;e.customProgramCacheKey=()=>`${o?o.call(e):""}#twin${r}`}return e}var BS=`${ud}-${_d}-${Zd}-${wd}-${yd}-${Ud}`;function zn(e,n){if(e.userData.hooks)return e;e.userData.hooks=n;let t=e.onBeforeCompile,r=Object.prototype.hasOwnProperty.call(e,"customProgramCacheKey")?e.customProgramCacheKey:null,o=t===e.constructor.prototype.onBeforeCompile||!Object.prototype.hasOwnProperty.call(e,"onBeforeCompile");return e.onBeforeCompile=(i,a)=>{o||t.call(e,i,a),Id(i,n),xd(i,n),Ad(i,n),Cd(i,n),hd(i),jd(i,e.userData.seeThrough)},e.customProgramCacheKey=()=>`${r?r.call(e):o?"":t.toString()}|${n}${e.userData.seeThrough?`+${e.userData.seeThrough}`:""}|${BS}`,o&&!e.userData.twin&&rn(e,"hooked",{kind:n}),e}var Jd=Pn(Gt("effects",{}),ft).seasons?eu(new Date):null,lR=Jd,eh=e=>e==="summer"?null:{name:e,...tu[e]},wn=eh(Jd??"summer"),th=0;function cR({season:e="summer",upkeep:n=0}={}){wn=eh(e),th=Math.min(1,Math.max(-1,Number.isFinite(n)?n:0))}function pl(e){return Number.isFinite(e)?e>=2?rr.share.green:e>=.75?rr.share.fairway:rr.share.rough:rr.share.rough}var Xr={h:0,s:0,l:0};function ml(e,n="grass",t=1){let r=n==="grass"?th*t:0;if(!wn&&!r||(e.getHSL(Xr),Xr.h<.14||Xr.h>.5))return e;let o=[Xr.h,Xr.s,Xr.l];return wn&&(o=ws(o,wn[n])),r&&(o=ws(o,(r>0?rr.dry:rr.lush).map(i=>i*Math.abs(r)))),e.setHSL(o[0],o[1],o[2])}var gl=(e,n,t)=>ml(new ye(e),n,t);function GS(e,n,t,r,o,i,a,s,l){if(Math.min(e,t,o)>a+l||Math.max(e,t,o)<a-l||Math.min(n,r,i)>s+l||Math.max(n,r,i)<s-l)return!1;let f=(t-e)*(s-n)-(r-n)*(a-e),c=(o-t)*(s-r)-(i-r)*(a-t),u=(e-o)*(s-i)-(n-i)*(a-o);if(f>=0&&c>=0&&u>=0||f<=0&&c<=0&&u<=0)return!0;let d=l*l;return _l(e,n,t,r,a,s)<=d||_l(t,r,o,i,a,s)<=d||_l(o,i,e,n,a,s)<=d}function _l(e,n,t,r,o,i){let a=t-e,s=r-n,l=a*a+s*s,f=l>0?Math.max(0,Math.min(1,((o-e)*a+(i-n)*s)/l)):0,c=e+a*f-o,u=n+s*f-i;return c*c+u*u}function nh(e,n,t,r=2){let o=Math.floor((n?n.length:e.length/3)/3),i=new Uint8Array(o),a=0;for(let s=0;s<o;s++){let l=(n?n[s*3]:s*3)*3,f=(n?n[s*3+1]:s*3+1)*3,c=(n?n[s*3+2]:s*3+2)*3;GS(e[l],e[l+2],e[f],e[f+2],e[c],e[c+2],t.x,t.z,r)&&(i[s]=1,a++)}return{near:i,count:a}}function rh(e,n){let t=n.length,r=0;for(let a=0;a<t;a++)r+=n[a];let o=new Uint32Array((t-r)*3),i=new Uint32Array(r*3);for(let a=0,s=0,l=0;a<t;a++){let f=n[a]?i:o,c=n[a]?l:s;for(let u=0;u<3;u++)f[c+u]=e?e[a*3+u]:a*3+u;n[a]?l+=3:s+=3}return{far:o,near:i}}function oh(e){let n=new Map,t=new Uint32Array(e.length);for(let r=0;r<e.length;r++){let o=n.get(e[r]);o===void 0&&(o=n.size,n.set(e[r],o)),t[r]=o}return{vertices:Uint32Array.from(n.keys()),index:t}}function vl(e,n,t){let r=new e.constructor(t.length*n);for(let o=0;o<t.length;o++){let i=t[o]*n;for(let a=0;a<n;a++)r[o*n+a]=e[i+a]}return r}var VS="GROUND_UNCUT";function sh(e,n){return n&&n.r>0&&(e.userData.cupCut={x:n.x,z:n.z,r:n.r}),e}var ih=new WeakMap;function ah(e){let n=ih.get(e);if(n)return n;n=new e.constructor;let t=e.userData;e.userData={};try{n.copy(e)}finally{e.userData=t}return n.userData={...t},delete n.userData.cupCut,delete n.userData.twin,n.userData.uncut=!0,n.onBeforeCompile=e.onBeforeCompile,Object.prototype.hasOwnProperty.call(e,"customProgramCacheKey")&&(n.customProgramCacheKey=e.customProgramCacheKey),n.defines={...e.defines??{},[VS]:""},t.twin&&rn(n,t.twin.kind,{...t.twin.options,uncut:!0}),t.shared||n.addEventListener("dispose",()=>e.dispose()),ih.set(e,n),n}function zS(e){let n=e.elements;return n[0]===1&&n[5]===1&&n[10]===1&&n[1]===0&&n[2]===0&&n[4]===0&&n[6]===0&&n[8]===0&&n[9]===0&&n[3]===0&&n[7]===0&&n[11]===0&&n[15]===1}function WS(e,n){let t=new xt;for(let[r,o]of Object.entries(e.attributes))t.setAttribute(r,new Oe(vl(o.array,o.itemSize,n.vertices),o.itemSize,o.normalized));return t.setIndex(new Oe(n.vertices.length>65535?n.index:Uint16Array.from(n.index),1)),t}function XS(e,n){if(e.index){let t=0;for(let r=0;r<n.length;r++)n[r]>t&&(t=n[r]);e.setIndex(new Oe(t>=65535?n:Uint16Array.from(n),1))}else for(let[t,r]of Object.entries(e.attributes))e.setAttribute(t,new Oe(vl(r.array,r.itemSize,n),r.itemSize,r.normalized))}function pR(e,n=2){let t={pieces:0,uncut:0,split:0,patch:0},r=[];e.traverse(i=>{i.isMesh&&!i.isInstancedMesh&&!i.isBatchedMesh&&!Array.isArray(i.material)&&i.material?.userData?.cupCut&&r.push(i)}),e.updateWorldMatrix(!0,!0);for(let i of[...new Set(r.map(a=>a.material))].sort((a,s)=>a.id-s.id))ah(i);let o=new Map;for(let i of r){t.pieces++;let a=i.material,s=i.geometry,l=s.attributes.position;if(!l||l.isInterleavedBufferAttribute||s.groups.length||s.drawRange.start!==0||s.drawRange.count!==1/0||Object.keys(s.morphAttributes).length||!zS(i.matrixWorld))continue;let c=a.userData.cupCut,u={x:c.x-i.matrixWorld.elements[12],z:c.z-i.matrixWorld.elements[14]},d=o.get(s);if(!d){s.boundingBox||s.computeBoundingBox();let h=s.boundingBox,T=u.x<h.min.x-n||u.x>h.max.x+n||u.z<h.min.z-n||u.z>h.max.z+n?{count:0}:nh(l.array,s.index?.array??null,u,n);if(d={found:T,patch:null},T.count&&T.count<T.near.length&&!a.transparent){let p=rh(s.index?.array??null,T.near);d.patch=WS(s,oh(p.near)),XS(s,p.far),t.split++,t.patch+=T.count}o.set(s,d)}if(!(d.found.count&&!d.patch)){if(d.patch){let h=new yt(d.patch,a);h.name=i.name?`${i.name} (round the cup)`:"round the cup";for(let T of["castShadow","receiveShadow","renderOrder","frustumCulled","visible","matrixAutoUpdate","customDepthMaterial","customDistanceMaterial"])h[T]=i[T];h.layers.mask=i.layers.mask,h.position.copy(i.position),h.quaternion.copy(i.quaternion),h.scale.copy(i.scale),h.userData={...i.userData},delete h.userData.keepGeometry;let _=i.parent;_.add(h),_.children.splice(_.children.indexOf(h),1),_.children.splice(_.children.indexOf(i)+1,0,h),h.updateMatrixWorld(!0)}i.material=ah(a),t.uncut++}}return t}function yi(e){let n=e.length,t=0;for(let r=0;r<n;r++){let[o,i]=e[r],[a,s]=e[(r+1)%n];t+=o*s-a*i}return t>0?-1:1}function lh(e,n=yi(e)){let t=e.length;return e.map((r,o)=>{let[i,a]=e[(o-1+t)%t],[s,l]=e[(o+1)%t],f=Math.hypot(s-i,l-a)||1;return[-(l-a)/f*n,(s-i)/f*n]})}function gR(e,{r:n=.01,every:t=Math.PI/12,sharp:r=Math.PI/6}={}){let o=e.length,i=yi(e),a=(c,u)=>{let d=Math.hypot(u[0]-c[0],u[1]-c[1])||1;return[(u[0]-c[0])/d,(u[1]-c[1])/d]},s=([c,u])=>[-u*i,c*i],l=[],f=[];for(let c=0;c<o;c++){let u=e[c],d=a(e[(c-1+o)%o],u),h=a(u,e[(c+1)%o]),_=s(d),T=s(h),p=Math.acos(Math.max(-1,Math.min(1,_[0]*T[0]+_[1]*T[1])));if(p<r||_[0]*h[0]+_[1]*h[1]>=0){l.push(u),f.push(c);continue}let m=Math.atan2(_[1],_[0]),v=Math.sign(_[0]*T[1]-_[1]*T[0]),x=Math.ceil(p/t);for(let g=0;g<=x;g++){let M=m+v*p*g/x;l.push([u[0]+Math.cos(M)*n,u[1]+Math.sin(M)*n]),f.push(c)}}return[l,f]}var ar={share:.6,fadeIn:.5,minFade:4,near:ys.full,end:150,fadeOut:.3,strength:1};function ch(e,{longGrass:n=!0,shed:t=!1}={}){if(t||e==="standard"||!e)return null;let r=n?ys.radius[e]:void 0,o=r?r*ar.share:ar.near,i=o+Math.max(ar.minFade,o*ar.fadeIn),a=ar.end;return{start:o,full:i,fadeFrom:a*(1-ar.fadeOut),end:a,strength:ar.strength}}var fh="far rough",$S="long grass";function uh(){let e=(ft==="high"||ft==="ultra")&&!rl($S),n=ch(ft,{longGrass:e,shed:rl(fh)});Wr.gFarRough.value=n?[n.start,n.full,n.fadeFrom,n.end]:[0,1,2,3],Wr.gFarRoughK.value=n?n.strength:0}dn(2.8,fh,uh,{of:"medium"});uh();var Sl=Pe&&Pn(Gt("effects",{}),ft).textures,El=Pe&&Pn(Gt("effects",{}),ft).wetshine,xl=At||El,Wn=null,Dt={rough:0,apron:.25,deep:.5,semi:.75,fairway:1,fairwayEdge:1.1,wear:1.5,fringe:2,tee:2,divot:2.1,verge:2.2,path:2.5,green:3,lip:4,sand:5,bank:4,water:6};function Ml(e,n){let t=Dt.green-n;return t!==0&&Object.assign(e,{polygonOffset:!0,polygonOffsetFactor:t,polygonOffsetUnits:t*2}),e.userData.groundLayer=n,e}function KS(){if(Wn)return Wn;let e=256,n=document.createElement("canvas");n.width=n.height=e;let t=n.getContext("2d");t.fillStyle="rgb(200,200,200)",t.fillRect(0,0,e,e);for(let r=0;r<9e3;r++){let o=Math.random()*e,i=Math.random()*e,a=Math.random()*Math.PI,s=2+Math.random()*5,l=150+Math.random()*100;t.strokeStyle=`rgba(${l},${l},${l},0.55)`,t.lineWidth=1,t.beginPath(),t.moveTo(o,i),t.lineTo(o+Math.cos(a)*s,i+Math.sin(a)*s),t.stroke()}return Wn=new ho(n),Wn.wrapS=Wn.wrapT=fn,Wn.anisotropy=8,Wn.colorSpace=un,Wn}function GR({light:e="#6aa640",dark:n="#5c9637",stripeWidth:t=8,stripeAngle:r=Math.PI/2,patch:o=.22,patchScale:i=.03,detailScale:a=1.2,detail:s=.8,tint:l=.5,hole:f=null,edge:c=!1,layer:u=Dt.green,worn:d=0,soil:h="#7d6a4b",clumps:_=0,settle:T=!1,wind:p=0,dune:m=0,mow:v=0,mowDir:x=null,centre:g=null,cleanup:M=!1,rim:b=!1,grain:A=null,shine:S=1}={}){let w=Ml(new En({color:16777215}),u);c&&Object.assign(w,{transparent:!0,depthWrite:!1});let y=!!f&&f.r>0;sh(w,f);let P={gLight:{value:gl(e,"grass",pl(u))},gDark:{value:gl(n,"grass",pl(u))},gStripeWidth:{value:t},gStripeDir:{value:x?new je(...x).normalize():new je(Math.cos(r),Math.sin(r))},gMowKind:{value:v},gMowCentre:{value:new je(...g??[0,0])},gPatch:{value:o},gPatchScale:{value:i},gDetail:Pe?Ao().tGrass:{value:KS()},gDetailScale:{value:a},gDetailStrength:{value:s},gTint:{value:l},gHole:{value:new te(f?.x??0,f?.z??0,f?.r??0)},gWorn:{value:d},gSoil:{value:new ye(h)},gClumps:{value:_},gWindy:{value:p},gDune:{value:m},gGrain:{value:new te(...A?[...new je(...A).normalize().toArray(),su.sheen]:[1,0,0])},gShine:{value:S}};return w.onBeforeCompile=D=>{Object.assign(D.uniforms,P,Wr),D.vertexShader=D.vertexShader.replace("#include <common>",`#include <common>
varying vec3 gWorld;${c?`
attribute float gEdgeIn;
varying float gEdge;`:""}${b?`
attribute float gRimIn;
varying float gRim;`:""}`).replace("#include <project_vertex>",`#include <project_vertex>
gWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;${c?`
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
        ${c?"varying float gEdge;":""}
        ${b?"varying float gRim;":""}
        ${Pe?Ot?`#define GROUND_FINE
#define GROUND_PHONE`:`#define GROUND_FINE
#define GROUND_TEX`:""}
        ${Sl?"#define GROUND_HERO":""}
        ${xl?"#define GROUND_PUDDLES":""}
        ${El&&!T?"#define GROUND_SHINE":""}
        ${Kd}
        ${Yd}
        float gPuddle = 0.0;
        float gDrops = 0.0;`).replace("#include <map_fragment>",`#include <map_fragment>
        {
          vec2 w = gWorld.xz;
          float stripe = 0.0;
          // Soft-edged bands, their edges wavering as a mower's do, in the
          // hole's pattern.
          if (gStripeWidth > 0.0) stripe = gMowing(w, gStripeDir, gStripeWidth, gMowKind, gMowCentre);
          ${M?"stripe = G_CLEANUP;":""}
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
          ${Pe?"grass = gFarRoughLook(grass, w, gWorld, gWindy);":""}
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
          ${c?`// Worn: scuffs of bare soil through the grass, most where it's
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
          ${c?`// A ragged, soft line where it gives way to the ground beneath.
          float cut = 0.2 + 0.45 * gNoise(w * 0.35) + 0.2 * gNoise(w * 1.7);
          // Worn grass fades in softly and in clumps - thin here, thick
          // there - rather than to a ragged line.
          diffuseColor.a *= gWorn > 0.0
            ? smoothstep(0.12, 0.55, gEdge * (0.2 + 1.0 * gNoise(w * 1.3 + 7.0) + 0.45 * gNoise(w * 3.4)))
            : smoothstep(cut - 0.14, cut + 0.14, gEdge);`:""}
        }`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
${Pe?qd("gLean"):""}`).replace("#include <opaque_fragment>",`#if defined(GROUND_PUDDLES) && defined(USE_FOG)
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
        #include <opaque_fragment>`)},w.customProgramCacheKey=()=>`grass-v12${m>0?"d":""}-${Wd}-${At?"u":Pe?"h":"s"}${Sl?"-hero":""}${Ot?"-p":""}${c?"-edge":""}${M?"-clean":""}${b?"-rim":""}${El?"-shine":""}${T?"-st":""}${y?"-cup":""}-r1`,rn(w,"grass",{light:P.gLight.value,dark:P.gDark.value,stripeWidth:t,stripeAngle:r,mow:v,mowDir:x,centre:g,cleanup:M,rim:b,patch:o,patchScale:i,detailScale:a,detail:s,detailMap:P.gDetail,tint:l,hole:f,edge:c,layer:u,worn:d,soil:h,clumps:_,settle:T,wind:p,dune:m,grain:A,fine:Pe,hero:Sl,tex:Pe,puddleDark:xl}),zn(w,"ground")}function kR(e,n,t=()=>0,r=0){return YS(e,[{off:0,edge:1},{off:n,edge:0}],t,r)}function YS(e,n,t=()=>0,r=0){let o=e.length,i=yi(e),a=lh(e,i),s=typeof n=="function"?n:()=>n,l=e.map((_,T)=>s(T)),f=l[0].length,c=[],u=[],d=[];for(let _=0;_<o;_++){let[T,p]=e[_],[m,v]=a[_];for(let x of l[_]){let g=T+m*x.off,M=p+v*x.off;c.push(g,t(g,M)+r,M),u.push(x.edge)}for(let x=0;x+1<f;x++){let g=_*f+x,M=(_+1)%o*f+x,b=l[_][x+1].off>l[_][x].off;i>0===b?d.push(g,g+1,M,M,g+1,M+1):d.push(g,M,g+1,M,M+1,g+1)}}let h=new xt;return h.setAttribute("position",new qt(c,3)),h.setAttribute("gEdgeIn",new qt(u,1)),h.setIndex(d),h.computeVertexNormals(),h}function VR(e,n,t,r){let o=e.geometry.attributes.position,i=new Float32Array(o.count);for(let a=0;a<o.count;a++){let s=o.getX(a)-n,l=o.getZ(a)-t;i[a]=r(Math.atan2(l,s))-Math.hypot(s,l)}return e.geometry.setAttribute("gRimIn",new Oe(i,1)),e}function zR(e){return{mow:e.kind,mowDir:$d(e.dir)}}function WR(e,n,t,r,o=1){let i=[],a=(s,l,f,c)=>{let u=Math.max(1,Math.ceil(Math.hypot(f-s,c-l)/o));for(let d=0;d<u;d++)i.push([s+(f-s)*d/u,l+(c-l)*d/u])};return a(e,n,t,n),a(t,n,t,r),a(t,r,e,r),a(e,r,e,n),i}var mt=pt,dh=1,Ci=1.25,Xn={fromAll:90,toAll:240,from:25,to:110,patch:.2,clumps:.6,flat:.92,settle:.75},XR={rough:{light:mt.rough[0],dark:mt.rough[1],stripeWidth:0,patch:.35,patchScale:.02,detailScale:.9,tint:.7,clumps:dh,wind:1,shine:.25,layer:Dt.rough},deep:{light:mt.deep,dark:mt.deep,stripeWidth:0,patch:.45,patchScale:.05,detailScale:.7,detail:1,tint:.8,clumps:Ci,wind:1,settle:!0,layer:Dt.deep},duneRough:{light:mt.duneRough,dark:mt.duneRough,stripeWidth:0,patch:.2,patchScale:.03,detailScale:.9,detail:1,tint:.6,clumps:dh*.8,wind:2,dune:1,shine:.25,layer:Dt.rough},fescue:{light:mt.fescue,dark:mt.fescueDry,stripeWidth:0,patch:.22,patchScale:.035,detailScale:.6,detail:1,tint:.6,clumps:Ci*.7,wind:2.6,dune:1,settle:!0,layer:Dt.deep},hay:{light:mt.hay,dark:mt.hayDry,stripeWidth:0,patch:.25,patchScale:.03,detailScale:.6,detail:1,tint:.55,clumps:Ci*.6,wind:3.2,dune:1,settle:!0,layer:Dt.deep},longGreen:{light:mt.longGreen,dark:mt.longGreen,stripeWidth:0,patch:.65,patchScale:.035,detailScale:.7,detail:1,tint:.9,clumps:Ci*1.3,wind:2.3,dune:.7,settle:!0,layer:Dt.deep},fairway:{light:mt.fairway[0],dark:mt.fairway[1],stripeWidth:9,stripeAngle:Math.PI/2,patch:.18,layer:Dt.fairway},semi:{light:mt.firstCut[0],dark:mt.firstCut[1],stripeWidth:0,patch:.26,patchScale:.03,detailScale:.8,tint:.6,clumps:.35,wind:.5,shine:.6,layer:Dt.semi},green:{light:mt.green[0],dark:mt.green[1],stripeWidth:3,stripeAngle:0,patch:.1,patchScale:.08,detailScale:.5,detail:.5,tint:.2,layer:Dt.green},fringe:{light:mt.fringe,dark:mt.fringe,stripeWidth:0,patch:.12,detailScale:.7,layer:Dt.fringe},tee:{light:mt.tee[0],dark:mt.tee[1],stripeWidth:1.5,stripeAngle:0,patch:.1,layer:Dt.tee}};function $R(e,n,t=Dt.fairway){let r=new yt(e,n);return r.renderOrder=-10+t,r.receiveShadow=!0,r}function Ve(e,n=!1){let t=e[0].index!==null,r=new Set(Object.keys(e[0].attributes)),o=new Set(Object.keys(e[0].morphAttributes)),i={},a={},s=e[0].morphTargetsRelative,l=new xt,f=0;for(let c=0;c<e.length;++c){let u=e[c],d=0;if(t!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let h in u.attributes){if(!r.has(h))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+'. All geometries must have compatible attributes; make sure "'+h+'" attribute exists among all geometries, or in none of them.'),null;i[h]===void 0&&(i[h]=[]),i[h].push(u.attributes[h]),d++}if(d!==r.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+". Make sure all geometries have the same number of attributes."),null;if(s!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let h in u.morphAttributes){if(!o.has(h))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+".  .morphAttributes must be consistent throughout all geometries."),null;a[h]===void 0&&(a[h]=[]),a[h].push(u.morphAttributes[h])}if(n){let h;if(t)h=u.index.count;else if(u.attributes.position!==void 0)h=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+c+". The geometry must have either an index or a position attribute"),null;l.addGroup(f,h,c),f+=h}}if(t){let c=0,u=[];for(let d=0;d<e.length;++d){let h=e[d].index;for(let _=0;_<h.count;++_)u.push(h.getX(_)+c);c+=e[d].attributes.position.count}l.setIndex(u)}for(let c in i){let u=hh(i[c]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+c+" attribute."),null;l.setAttribute(c,u)}for(let c in a){let u=a[c][0].length;if(u!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[c]=[];for(let d=0;d<u;++d){let h=[];for(let T=0;T<a[c].length;++T)h.push(a[c][T][d]);let _=hh(h);if(!_)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+c+" morphAttribute."),null;l.morphAttributes[c].push(_)}}}return l}function hh(e){let n,t,r,o=-1,i=0;for(let f=0;f<e.length;++f){let c=e[f];if(n===void 0&&(n=c.array.constructor),n!==c.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=c.itemSize),t!==c.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(r===void 0&&(r=c.normalized),r!==c.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(o===-1&&(o=c.gpuType),o!==c.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;i+=c.count*t}let a=new n(i),s=new Oe(a,t,r),l=0;for(let f=0;f<e.length;++f){let c=e[f];if(c.isInterleavedBufferAttribute){let u=l/t;for(let d=0,h=c.count;d<h;d++)for(let _=0;_<t;_++){let T=c.getComponent(d,_);s.setComponent(d+u,_,T)}}else a.set(c.array,l);l+=c.count*t}return o!==void 0&&(s.gpuType=o),s}function Tl(e,n=1e-4){n=Math.max(n,Number.EPSILON);let t={},r=e.getIndex(),o=e.getAttribute("position"),i=r?r.count:o.count,a=0,s=Object.keys(e.attributes),l={},f={},c=[],u=["getX","getY","getZ","getW"],d=["setX","setY","setZ","setW"];for(let v=0,x=s.length;v<x;v++){let g=s[v],M=e.attributes[g];l[g]=new M.constructor(new M.array.constructor(M.count*M.itemSize),M.itemSize,M.normalized);let b=e.morphAttributes[g];b&&(f[g]||(f[g]=[]),b.forEach((A,S)=>{let w=new A.array.constructor(A.count*A.itemSize);f[g][S]=new A.constructor(w,A.itemSize,A.normalized)}))}let h=n*.5,_=Math.log10(1/n),T=Math.pow(10,_),p=h*T;for(let v=0;v<i;v++){let x=r?r.getX(v):v,g="";for(let M=0,b=s.length;M<b;M++){let A=s[M],S=e.getAttribute(A),w=S.itemSize;for(let y=0;y<w;y++)g+=`${Math.trunc(S[u[y]](x)*T+p)},`}if(g in t)c.push(t[g]);else{for(let M=0,b=s.length;M<b;M++){let A=s[M],S=e.getAttribute(A),w=e.morphAttributes[A],y=S.itemSize,P=l[A],D=f[A];for(let U=0;U<y;U++){let L=u[U],H=d[U];if(P[H](a,S[L](x)),w)for(let z=0,F=w.length;z<F;z++)D[z][H](a,w[z][L](x))}}t[g]=a,c.push(a),a++}}let m=e.clone();for(let v in e.attributes){let x=l[v];if(m.setAttribute(v,new x.constructor(x.array.slice(0,a*x.itemSize),x.itemSize,x.normalized)),v in f)for(let g=0;g<f[v].length;g++){let M=f[v][g];m.morphAttributes[v][g]=new M.constructor(M.array.slice(0,a*M.itemSize),M.itemSize,M.normalized)}}return m.setIndex(c),m}function qR(e,n=Math.PI/3){let t=e.index?e.toNonIndexed():e,r=t.attributes.position,o=r.count,i;if(r.isBufferAttribute===!0&&r.itemSize===3&&r.normalized===!1)i=r.array;else{i=new Float64Array(o*3);for(let g=0;g<o;g++)i[3*g+0]=r.getX(g),i[3*g+1]=r.getY(g),i[3*g+2]=r.getZ(g)}let a=Math.cos(n),s=(1+1e-10)*100,l=o/3,f=new Float64Array(l*3);for(let g=0;g<l;g++){let M=9*g,b=i[M+0],A=i[M+1],S=i[M+2],w=i[M+3],y=i[M+4],P=i[M+5],D=i[M+6],U=i[M+7],L=i[M+8],H=D-w,z=U-y,F=L-P,X=b-w,$=A-y,j=S-P,Z=z*j-F*$,ge=F*X-H*j,Ee=H*$-z*X,ze=1/(Math.sqrt(Z*Z+ge*ge+Ee*Ee)||1);f[3*g+0]=Z*ze,f[3*g+1]=ge*ze,f[3*g+2]=Ee*ze}let c=new Int32Array(o),u=new Float64Array(o*3),d=1;for(;d<o*2;)d<<=1;let h=d-1,_=new Int32Array(d),T=0;for(let g=0;g<o;g++){let M=3*g,b=Math.trunc(i[M+0]*s),A=Math.trunc(i[M+1]*s),S=Math.trunc(i[M+2]*s),w=(Math.imul(b,73856093)^Math.imul(A,19349663)^Math.imul(S,83492791))&h;for(;;){let y=_[w];if(y===0){let D=3*T;u[D+0]=b,u[D+1]=A,u[D+2]=S,_[w]=T+1,c[g]=T++;break}let P=3*(y-1);if(u[P+0]===b&&u[P+1]===A&&u[P+2]===S){c[g]=y-1;break}w=w+1&h}}let p=new Int32Array(T+1);for(let g=0;g<o;g++)p[c[g]+1]++;for(let g=0;g<T;g++)p[g+1]+=p[g];let m=new Int32Array(o),v=p.slice(0,T);for(let g=0;g<l;g++){let M=3*g;m[v[c[M+0]]++]=g,m[v[c[M+1]]++]=g,m[v[c[M+2]]++]=g}let x=new Float32Array(o*3);for(let g=0;g<l;g++){let M=3*g,b=f[M+0],A=f[M+1],S=f[M+2];for(let w=0;w<3;w++){let y=M+w,P=c[y],D=0,U=0,L=0;for(let z=p[P],F=p[P+1];z<F;z++){let X=3*m[z],$=f[X+0],j=f[X+1],Z=f[X+2];b*$+A*j+S*Z>a&&(D+=$,U+=j,L+=Z)}let H=1/(Math.sqrt(D*D+U*U+L*L)||1);x[3*y+0]=D*H,x[3*y+1]=U*H,x[3*y+2]=L*H}}return t.setAttribute("normal",new Oe(x,3,!1)),t}var qS={size:70,fine:26,hue:.03,sat:.08,light:.055};function ph(e,n,t=0){let r=qS,o=Yo(e,n,r.size,t^334461)*2-1,i=Yo(e+113.7,n-41.3,r.fine,t^11239)*2-1,a=.7*o+.3*i,s=Yo(e-57.1,n+89.9,r.size*1.3,t^30657)*2-1;return{hue:-r.hue*a,sat:r.sat*s,light:r.light*a}}var Ro={radius:9,crowded:6,hue:.012,sat:.04,light:.045};function mh(e,{radius:n=Ro.radius,crowded:t=Ro.crowded}={}){let r=n,o=new Map,i=(l,f)=>l*73856093+f*19349663;e.forEach(([l,f],c)=>{let u=i(Math.floor(l/r),Math.floor(f/r)),d=o.get(u);d?d.push(c):o.set(u,[c])});let a=new Float32Array(e.length),s=n*n;return e.forEach(([l,f],c)=>{let u=Math.floor(l/r),d=Math.floor(f/r),h=0;for(let _=u-1;_<=u+1;_++)for(let T=d-1;T<=d+1;T++)for(let p of o.get(i(_,T))??[]){if(p===c)continue;let m=e[p][0]-l,v=e[p][1]-f;m*m+v*v<=s&&h++}a[c]=Math.max(0,1-h/t)}),a}function gh(e,n){let t=n*2-1;return{hue:e.hue-Ro.hue*t,sat:e.sat+Ro.sat*t,light:e.light+Ro.light*t}}var sr={r:{oak:2.1,leaf:1.8,willow:1.9,poplar:1.3,birch:1.2,bush:1,pine:1.7,scots:1.7,spruce:1.6,column:1.1,snag:.9,beech:2.2,chestnut:2,cedar:2.3,holly:1.1,hawthorn:1.2},least:.6,most:3,needles:new Set(["pine","scots","spruce","column","cedar"]),lift:.02},_h={leaves:[1,1,1],needles:[1.12,.92,.78],soil:[.92,.9,.88]};function vh(e,n=1,t=0){let r=sr.r[e]??sr.r.leaf,o=Math.min(sr.most,Math.max(sr.least,r*n)),i=e==="snag"?"soil":sr.needles.has(e)?"needles":"leaves",a=Math.sin((t+1)*12.9898)*43758.5453;return{r:o,litter:i,turn:(a-Math.floor(a))*Math.PI*2}}function ZS(e){return()=>(e=Math.imul(e,1664525)+1013904223|0,(e>>>0)/4294967296)}var $r=null;function jS(){if($r)return $r;let e=512,n=document.createElement("canvas");n.width=n.height=e;let t=n.getContext("2d"),r=ZS(61447),o=e/2;for(let i=0;i<160;i++){let a=r()*Math.PI*2,s=Math.pow(r(),.7)*o*.78,l=o*(.08+r()*.16)*(1-s/o*.5),f=t.createRadialGradient(o+Math.cos(a)*s,o+Math.sin(a)*s,0,o+Math.cos(a)*s,o+Math.sin(a)*s,l),c=40+r()*22,u=.34+r()*.2;f&&(f.addColorStop(0,`rgba(${c+22},${c+10},${c-6},${u})`),f.addColorStop(1,`rgba(${c+22},${c+10},${c-6},0)`),t.fillStyle=f,t.fillRect(0,0,e,e))}for(let i=0;i<900;i++){let a=r()*Math.PI*2,s=Math.pow(r(),.85)*o*.86,l=1-Math.pow(s/(o*.86),2);if(r()>l+.15)continue;let f=r(),[c,u,d]=f<.45?[118,82,44]:f<.75?[150,112,60]:f<.9?[92,64,38]:[98,110,52],h=.8+r()*.4;t.save(),t.translate(o+Math.cos(a)*s,o+Math.sin(a)*s),t.rotate(r()*Math.PI),t.fillStyle=`rgba(${c*h},${u*h},${d*h},${.6+r()*.35})`,t.beginPath(),t.ellipse(0,0,3+r()*4,1.6+r()*2,0,0,Math.PI*2),t.fill(),t.restore()}t.lineCap="round";for(let i=0;i<70;i++){let a=r()*Math.PI*2,s=r()*o*.7,l=o+Math.cos(a)*s,f=o+Math.sin(a)*s,c=r()*Math.PI,u=6+r()*16;t.strokeStyle=`rgba(${60+r()*30},${44+r()*20},28,${.55+r()*.3})`,t.lineWidth=1+r()*1.4,t.beginPath(),t.moveTo(l,f),t.lineTo(l+Math.cos(c)*u,f+Math.sin(c)*u),t.stroke()}for(let i=0;i<6;i++){let a=i/6*Math.PI*2+r()*.6;t.strokeStyle="rgba(58,40,24,0.55)",t.lineWidth=7-i*.4,t.beginPath(),t.moveTo(o,o);let s=o*(.22+r()*.18),l=(r()-.5)*.5;t.quadraticCurveTo(o+Math.cos(a+l)*s*.6,o+Math.sin(a+l)*s*.6,o+Math.cos(a)*s,o+Math.sin(a)*s),t.stroke()}return $r=new ho(n),$r.colorSpace=Dr,$r.anisotropy=4,$r}var QS={pc:{seg:20,rings:[0,.35,.7,1]},phone:{seg:12,rings:[0,.5,1]}};function Sh(e,n,{phone:t=Ot}={}){if(!e.length)return null;let{seg:r,rings:o}=QS[t?"phone":"pc"],i=1+r*(o.length-1),a=new Float32Array(e.length*i*3),s=new Float32Array(e.length*i*2),l=new Float32Array(e.length*i*3),f=[];e.forEach((_,T)=>{let p=vh(_.kind,_.width,_.seed),m=_h[p.litter],v=T*i,x=(g,M,b,A,S)=>{a.set([M,n(M,b)+sr.lift,b],(v+g)*3),s.set([A,S],(v+g)*2),l.set(m,(v+g)*3)};x(0,_.x,_.z,.5,.5);for(let g=1;g<o.length;g++)for(let M=0;M<r;M++){let b=M/r*Math.PI*2,A=o[g]*p.r;x(1+(g-1)*r+M,_.x+Math.cos(b)*A,_.z+Math.sin(b)*A,.5+Math.cos(b+p.turn)*o[g]*.5,.5+Math.sin(b+p.turn)*o[g]*.5)}for(let g=0;g<r;g++)f.push(v,v+1+(g+1)%r,v+1+g);for(let g=1;g<o.length-1;g++){let M=v+1+(g-1)*r,b=M+r;for(let A=0;A<r;A++){let S=(A+1)%r;f.push(M+A,M+S,b+A,b+A,M+S,b+S)}}});let c=new xt;c.setAttribute("position",new Oe(a,3)),c.setAttribute("uv",new Oe(s,2)),c.setAttribute("color",new Oe(l,3)),c.setIndex(f),c.computeVertexNormals();let u=c.attributes.normal;for(let _=0;_<u.count;_++)u.getY(_)<0&&u.setXYZ(_,-u.getX(_),-u.getY(_),-u.getZ(_));let d=zn(Ml(new En({map:jS(),vertexColors:!0,transparent:!0,depthWrite:!1}),Dt.wear),"ground"),h=new yt(c,d);return h.name="tree feet",h.renderOrder=-10+Dt.wear,h.receiveShadow=!0,h}var cr=null,Mh=typeof fetch=="function"&&typeof location<"u"&&/^https?:$/.test(location.protocol)?fetch("/api/bakes").then(e=>e.ok?e.json():null).then(e=>{cr=typeof e?.stamp=="string"?e.stamp:null}).catch(()=>{}):Promise.resolve();function a2(){return!!cr}function Li(e,n=!1){let t=r=>n?r.slice():r;return{attributes:Object.entries(e.attributes).map(([r,o])=>[r,t(o.array),o.itemSize,!!o.normalized]),index:e.index?t(e.index.array):null,groups:e.groups.map(r=>({...r})),drawRange:[e.drawRange.start,e.drawRange.count],sphere:!!e.boundingSphere,box:!!e.boundingBox}}function wl(e){let n=new xt;for(let[t,r,o,i]of e.attributes)n.setAttribute(t,new Oe(r,o,i));e.index&&n.setIndex(new Oe(e.index,1));for(let t of e.groups??[])n.addGroup(t.start,t.count,t.materialIndex);return e.drawRange&&n.setDrawRange(e.drawRange[0],e.drawRange[1]),e.box&&n.computeBoundingBox(),e.sphere&&n.computeBoundingSphere(),n}var JS=e=>e?.isBufferGeometry?Li(e):e,ex=e=>io(e??null,{as:JS});function Pi(e){if(e===null||typeof e!="object")return e;if(ArrayBuffer.isView(e))return e.slice();if(Array.isArray(e))return e.map(Pi);let n={};for(let[t,r]of Object.entries(e))n[t]=Pi(r);return n}var yo=class{constructor(n,t=new Map){this.key=n,this.kept=t,this.used=new Map,this.made=new Map,this.hits=0,this.misses=0,this.first=!1,this.ms=0}partKey(n,t){return`${n}:${ex(t)}`}take(n){let t=this.used.get(n)??this.made.get(n)??this.kept.get(n);if(t!==void 0)return this.made.has(n)||this.used.set(n,t),Pi(t)}has(n,t){let r=this.partKey(n,t);return this.made.has(r)||this.used.has(r)||this.kept.has(r)}geometry(n,t,r,{keep:o=null}={}){let i=performance.now(),a=this.partKey(n,t),s=this.take(a);if(this.ms+=performance.now()-i,s)return this.hits++,wl(s);let l=r();if(this.misses++,o&&!o())return l;let f=performance.now();return this.made.set(a,Li(l,!0)),this.ms+=performance.now()-f,l}find(n,t){let r=performance.now(),o=this.take(this.partKey(n,t));return this.ms+=performance.now()-r,o!==void 0&&this.hits++,o}keep(n,t,r){this.keepAt(this.partKey(n,t),r)}keepAt(n,t){if(t==null)return;let r=performance.now();this.made.set(n,Pi(t)),this.ms+=performance.now()-r,this.misses++}get changed(){return this.made.size>0}entries(){return new Map([...this.used,...this.made])}bytes(){return Nc(this.entries())}summary(){return{hits:this.hits,misses:this.misses,ms:Math.round(this.ms)}}};async function Th(e,n){await Mh;let t=cr&&n?ua(cr,e,n):null;if(!t)return null;try{let r=await fetch(`/api/bakes/${t}`);return r.ok?new yo(t,Oc(await r.arrayBuffer())):new yo(t)}catch(r){return console.warn("Couldn't read the kept hole; building it afresh:",r?.message??r),new yo(t)}}function s2(e,n){return cr&&n?ua(cr,e,n):null}async function l2(){if(await Mh,!cr)return null;try{let e=await fetch("/api/bakes?names=1");if(!e.ok)return null;let n=await e.json();return Array.isArray(n?.names)?new Set(n.names):null}catch{return null}}var xh=!1,lr=null,bl=typeof Worker>"u",tx=1,Kr=new Map;function nx(){if(bl)return null;if(lr)return lr;try{lr=new Worker(new URL("../bakeworker.js",import.meta.url),{type:"module"})}catch{return bl=!0,null}return lr.onmessage=({data:e})=>{let n=Kr.get(e.id);Kr.delete(e.id),n?.(e)},lr.onerror=()=>{bl=!0,lr=null;for(let e of Kr.values())e({error:"the worker stopped"});Kr.clear()},lr}function bh(e,n=new Set){if(!e||typeof e!="object")return n;if(ArrayBuffer.isView(e))return e.buffer instanceof ArrayBuffer&&n.add(e.buffer),n;for(let t of e instanceof Map?e.values():Object.values(e))bh(t,n);return n}var rx=(e,n=!1)=>`/api/bakes/${e}${n?"?first=1":""}`;async function wh(e){if(!e?.changed)return 0;let n=r=>(xh||console.warn("Couldn't keep the hole for next time:",r?.message??r),xh=!0,0),t=nx();if(t){let r=e.entries(),o=tx++,i=new Promise(s=>Kr.set(o,s));try{t.postMessage({id:o,key:e.key,first:e.first,entries:r,back:ox},[...bh(r)])}catch(s){return Kr.delete(o),n(s)}let a=await i;return a.error?n(new Error(a.error)):a.data?Eh(e,a.data,n):a.bytes}return Eh(e,e.bytes(),n)}var ox=typeof window<"u"&&!!window.pocket;async function Eh(e,n,t){try{let r=await fetch(rx(e.key,e.first),{method:"PUT",headers:{"Content-Type":"application/octet-stream"},body:new Blob([n])});if(!r.ok)throw new Error(`the server said ${r.status}`);return n.byteLength}catch(r){return t(r)}}function c2(e,n={}){if(!e)return null;try{return io({site:e,...n})}catch{return null}}function Ah(e,n,t,r,o){let i=Math.max(0,Math.floor(o));if(!i||t<=2*i||r<=2*i)return n;let a=e===n?e.slice():e,s=new Int32Array(t*r);for(let l=0;l<r;l++){let f=l*t,c=0;for(let u=0;u<2*i;u++)a[(f+u)*4+3]>=200&&c++;for(let u=i;u<t-i;u++)a[(f+u+i)*4+3]>=200&&c++,s[f+u]=c,a[(f+u-i)*4+3]>=200&&c--}for(let l=i;l<r-i;l++)for(let f=i;f<t-i;f++){let c=(l*t+f)*4;if(a[c+3]>16)continue;let u=0;for(let T=-i;T<=i;T++)u+=s[(l+T)*t+f];if(!u)continue;let d=0,h=0,_=0;for(let T=-i;T<=i;T++)for(let p=-i;p<=i;p++){let m=((l+T)*t+(f+p))*4;a[m+3]<200||(d+=a[m],h+=a[m+1],_+=a[m+2])}n[c]=d/u,n[c+1]=h/u,n[c+2]=_/u,n[c+3]=32}return n}var Co={near:3.5,close:6,apart:.36,out:1.06,radius:[.42,.58],droop:.3,wave:.3,up:.4,under:-.6,over:1,fresh:.3,freshTint:[1,1,.74]},Al=6;function Rh(e,n,t,r=Co){let o=[];for(let[m,v,x,g]of e){let M=Math.max(12,Math.round(g*g*10));for(let b=0;b<M;b++){let A=r.under+((r.over??1)-r.under)*((b+n())/M),S=b*2.39996+n()*.8,w=Math.sqrt(Math.max(0,1-A*A)),y=[w*Math.cos(S),A,w*Math.sin(S)],P=[m+y[0]*g*r.out,v+y[1]*g*r.out,x+y[2]*g*r.out];e.some(([D,U,L,H])=>(D!==m||U!==v||L!==x)&&Math.hypot(P[0]-D,P[1]-U,P[2]-L)<H*1.02)||o.push({at:P,dir:y,r:g,pick:n()})}}o.sort((m,v)=>m.pick-v.pick);let i=[];for(let m of o){if(i.length>=t)break;i.every(v=>Math.hypot(v.at[0]-m.at[0],v.at[1]-m.at[1],v.at[2]-m.at[2])>=r.apart*Math.min(v.r,m.r))&&i.push(m)}if(!i.length)return null;let a=[],s=[],l=[],f=[],c=[],u=new te,d=new te,h=new te,_=new te,T=new te;for(let{at:m,dir:v,r:x}of i){let g=x*(r.radius[0]+n()*(r.radius[1]-r.radius[0])),M=n()*Math.PI*2,b=.86+n()*.14;u.set(v[0],v[1]+r.up,v[2]).normalize(),d.set(0,1,0),Math.abs(u.y)>.92&&d.set(1,0,0),d.cross(u).normalize(),h.crossVectors(u,d);let A=a.length/3;a.push(m[0],m[1],m[2]),s.push(u.x,u.y,u.z),l.push(.5,.5);let S=((A+1)*2654435761>>>0)/4294967296<(r.fresh??0),[w,y,P]=S?r.freshTint:[b,b,b];f.push(w,y,P);for(let D=0;D<Al;D++){let U=M+D/Al*Math.PI*2,[L,H]=[Math.cos(U),Math.sin(U)],z=r.droop*g*(1+(D%2?r.wave:-r.wave));_.set(m[0],m[1],m[2]).addScaledVector(d,L*g).addScaledVector(h,H*g).addScaledVector(u,-z),T.copy(u).addScaledVector(d,L*.6).addScaledVector(h,H*.6).normalize(),a.push(_.x,_.y,_.z),s.push(T.x,T.y,T.z),l.push(.5+.5*L,.5+.5*H),f.push(w*.9,y*.9,P*.9),c.push(A,A+1+D,A+1+(D+1)%Al)}}let p=new xt;return p.setAttribute("position",new Oe(new Float32Array(a),3)),p.setAttribute("normal",new Oe(new Float32Array(s),3)),p.setAttribute("uv",new Oe(new Float32Array(l),2)),p.setAttribute("color",new Oe(new Float32Array(f),3)),p.setIndex(c),p}var Rl=(e,n=1)=>`rgb(${e*.42*n|0},${e*.7*n|0},${e*.3*n|0})`,yh=e=>`rgb(${e*.6|0},${Math.min(255,e*.95)|0},${e*.42|0})`,Di=(e,n=0)=>`rgb(${e*(.38-n*.08)|0},${e*.7|0},${e*(.3+n*.22)|0})`,ix={leaves:26,len:[34,50],wide:.44,spines:4,spine:.3,berries:4,berry:4.4},ax={leaves:46,len:[17,27],lobes:3},sx={sprays:7,leaves:7,len:[24,34],wide:.3},lx={twigs:9,needles:30,len:[7,11]},cx={tufts:11,needles:22,len:[26,40]},fx={sprays:6,rosettes:9,needles:9,len:[7,10],cones:3};function Po(e,n,t,r,o,i){let a=[];for(let s=0;s<e;s++){let l=t()*Math.PI*2,f=n*r*Math.sqrt(t());a.push([n/2+Math.cos(l)*f,n/2+Math.sin(l)*f,t()*Math.PI*2,o+t()*(i-o)])}return a.sort((s,l)=>s[3]-l[3])}function ux(e,n,t,{dilate:r}){let o=ix,i=(s,l,f,c,u)=>{let d=c*o.wide;e.save(),e.translate(s,l),e.rotate(f);let h=T=>{let p=[];for(let m=0;m<=o.spines;m++){let v=(m+.5)/(o.spines+.5),x=Math.sin(Math.min(1,v*.98)*Math.PI)*.9+.1;p.push([c*(v-.5/(o.spines+.5))*.94,T*d*x*(1-o.spine)]),p.push([c*v*.94,T*d*x*(1+o.spine)])}return p},_=()=>{e.beginPath(),e.moveTo(0,0);for(let[T,p]of h(1))e.lineTo(T,p);e.lineTo(c,0);for(let[T,p]of h(-1).reverse())e.lineTo(T,p);e.closePath()};e.save(),e.globalCompositeOperation="source-atop",e.translate(c*.05,c*.06),_(),e.fillStyle="rgba(10,22,10,0.3)",e.fill(),e.restore(),_(),e.fillStyle=Rl(u,.9),e.fill(),e.save(),e.globalCompositeOperation="source-atop",e.fillStyle=`rgba(${Math.min(255,u*1.25)|0},${Math.min(255,u*1.5)|0},${Math.min(255,u*1.05)|0},0.4)`,e.beginPath(),e.ellipse(c*.5,-d*.3,c*.3,d*.16,0,0,Math.PI*2),e.fill(),e.strokeStyle=`rgba(${u*.9|0},${Math.min(255,u*1.15)|0},${u*.5|0},0.9)`,e.lineWidth=Math.max(.6,c*.028),e.beginPath(),e.moveTo(c*.04,0),e.lineTo(c*.95,0),e.stroke(),e.restore(),e.restore()},a=Po(o.leaves,n,t,.36,92,168);for(let[s,l,f,c]of a)i(s,l,f,o.len[0]+t()*(o.len[1]-o.len[0]),c);for(let s=0;s<o.berries;s++){let l=t()*Math.PI*2,f=n*.3*Math.sqrt(t()),c=n/2+Math.cos(l)*f,u=n/2+Math.sin(l)*f,d=3+Math.floor(t()*3);for(let h=0;h<d;h++){let _=c+(t()-.5)*o.berry*2.4,T=u+(t()-.5)*o.berry*2.4,p=o.berry*(.8+t()*.35);e.fillStyle="rgb(150,14,18)",e.beginPath(),e.arc(_+p*.12,T+p*.14,p,0,Math.PI*2),e.fill(),e.fillStyle="rgb(255,52,40)",e.beginPath(),e.arc(_,T,p*.88,0,Math.PI*2),e.fill(),e.fillStyle="rgba(255,225,215,0.85)",e.beginPath(),e.arc(_-p*.3,T-p*.32,p*.26,0,Math.PI*2),e.fill()}}r(e,2)}function dx(e,n,t,{dilate:r}){let o=ax,i=(a,s,l,f,c)=>{e.save(),e.translate(a,s),e.rotate(l);let u=o.lobes+Math.floor(t()*2),d=()=>{e.beginPath(),e.moveTo(0,0);let h=44;for(let _=0;_<=h;_++){let T=-1+2*_/h,p=T*1.95,m=Math.pow(Math.abs(Math.cos(T*u*Math.PI*.5)),.55),v=f*(.34+.66*m)*(.62+.38*Math.cos(p*.5));e.lineTo(f*.18+Math.cos(p)*v*.82,Math.sin(p)*v*.82)}e.closePath()};e.save(),e.globalCompositeOperation="source-atop",e.translate(f*.06,f*.07),d(),e.fillStyle="rgba(18,30,12,0.24)",e.fill(),e.restore(),d(),e.fillStyle=Rl(c),e.fill(),e.save(),e.translate(f*.3,0),e.scale(.55,.5),e.translate(-f*.18,0),d(),e.fillStyle=yh(c),e.fill(),e.restore(),e.strokeStyle=`rgba(${c*.75|0},${Math.min(255,c)|0},${c*.35|0},0.8)`,e.lineWidth=Math.max(.5,f*.035),e.beginPath(),e.moveTo(-f*.12,0),e.lineTo(f*.78,0),e.stroke(),e.restore()};for(let[a,s,l,f]of Po(o.leaves,n,t,.39,100,178))i(a,s,l,o.len[0]+t()*(o.len[1]-o.len[0]),f);r(e,1)}function hx(e,n,t,{dilate:r}){let o=sx,i=(s,l,f,c,u)=>{let d=c*o.wide;e.save(),e.translate(s,l),e.rotate(f);let h=()=>{e.beginPath(),e.moveTo(0,0);let _=16;for(let T=1;T<=_;T++)e.lineTo(T/_*c,d*Math.pow(Math.sin(T/_*Math.PI),.8)*(1-.25*(T/_)));for(let T=_;T>=0;T--)e.lineTo(T/_*c,-d*Math.pow(Math.sin(T/_*Math.PI),.8)*(1-.25*(T/_)));e.closePath()};e.save(),e.globalCompositeOperation="source-atop",e.translate(c*.05,c*.06),h(),e.fillStyle="rgba(18,30,12,0.22)",e.fill(),e.restore(),h(),e.fillStyle=Rl(u),e.fill(),e.save(),e.translate(c*.15,0),e.scale(.7,.55),h(),e.fillStyle=yh(u),e.fill(),e.restore(),e.save(),e.globalCompositeOperation="source-atop",e.strokeStyle=`rgba(${u*.34|0},${u*.56|0},${u*.24|0},0.5)`,e.lineWidth=Math.max(.35,c*.014),e.beginPath();for(let _=1;_<=7;_++){let T=_/8.5;for(let p of[-1,1])e.moveTo(c*T,0),e.lineTo(c*(T+.1),p*d*.9*Math.sin((T+.1)*Math.PI))}e.stroke(),e.strokeStyle=`rgba(${u*.78|0},${Math.min(255,u*1.02)|0},${u*.36|0},0.85)`,e.lineWidth=Math.max(.5,c*.024),e.beginPath(),e.moveTo(0,0),e.lineTo(c*.95,0),e.stroke(),e.restore(),e.restore()},a=Po(o.sprays,n,t,.2,100,172);for(let[s,l,f,c]of a){let u=n*(.26+t()*.1);e.strokeStyle="rgb(92,74,52)",e.lineWidth=1.4,e.beginPath(),e.moveTo(s,l),e.lineTo(s+Math.cos(f)*u,l+Math.sin(f)*u),e.stroke();for(let d=o.leaves-1;d>=0;d--){let h=(d+.6)/o.leaves,_=d%2?1:-1,T=(o.len[0]+t()*(o.len[1]-o.len[0]))*(1-.3*h);i(s+Math.cos(f)*u*h,l+Math.sin(f)*u*h,f+_*(.75+t()*.2)*(d===o.leaves-1?.15:1),T,c*(.92+t()*.16))}}r(e,2)}function px(e,n,t,{dilate:r}){let o=lx,i=[];for(let a=0;a<o.twigs;a++)i.push([n*(.16+.68*((a+t()*.6)/o.twigs)),n*(.14+t()*.2),Math.PI/2+(t()-.5)*.5,n*(.42+t()*.22),78+t()*62]);i.sort((a,s)=>a[4]-s[4]);for(let[a,s,l,f,c]of i){e.strokeStyle="rgb(84,62,40)",e.lineWidth=1.6,e.beginPath(),e.moveTo(a,s),e.lineTo(a+Math.cos(l)*f,s+Math.sin(l)*f),e.stroke();for(let u=0;u<=o.needles;u++){let d=u/o.needles,h=a+Math.cos(l)*f*d,_=s+Math.sin(l)*f*d,T=(o.len[0]+t()*(o.len[1]-o.len[0]))*(1-.35*d);for(let p of[-1,1]){let m=l+p*(1+t()*.45),v=c+(t()-.5)*34;e.strokeStyle=Di(v,.5),e.lineWidth=2.2,e.beginPath(),e.moveTo(h,_),e.lineTo(h+Math.cos(m)*T,_+Math.sin(m)*T),e.stroke()}}e.strokeStyle=Di(c+70,.2),e.lineWidth=3,e.beginPath(),e.moveTo(a+Math.cos(l)*f*.94,s+Math.sin(l)*f*.94),e.lineTo(a+Math.cos(l)*f*1.04,s+Math.sin(l)*f*1.04),e.stroke()}r(e,1)}function mx(e,n,t,{dilate:r}){let o=cx;for(let[i,a,s,l]of Po(o.tufts,n,t,.33,86,150)){e.strokeStyle="rgb(120,84,52)",e.lineWidth=1.8,e.beginPath(),e.moveTo(i,a),e.lineTo(i-Math.cos(s)*16,a-Math.sin(s)*16),e.stroke();for(let f=0;f<o.needles;f++){let c=s+(t()-.5)*3.6,u=o.len[0]+t()*(o.len[1]-o.len[0]),d=l+(t()-.5)*40;e.strokeStyle=Di(d,1),e.lineWidth=1.9,e.beginPath(),e.moveTo(i,a),e.quadraticCurveTo(i+Math.cos(c)*u*.5+(t()-.5)*4,a+Math.sin(c)*u*.5+(t()-.5)*4,i+Math.cos(c)*u,a+Math.sin(c)*u),e.stroke()}}r(e,1)}function gx(e,n,t,{dilate:r}){let o=fx,i=[];for(let[a,s,l,f]of Po(o.sprays,n,t,.12,84,140)){let c=n*(.3+t()*.1);e.strokeStyle="rgb(96,72,50)",e.lineWidth=2,e.beginPath(),e.moveTo(a,s),e.lineTo(a+Math.cos(l)*c,s+Math.sin(l)*c),e.stroke();for(let u=0;u<o.rosettes;u++){let d=(u+.7)/o.rosettes,h=u%2?1:-1,_=(6+t()*9)*(1-.4*d),T=a+Math.cos(l)*c*d+Math.cos(l+h*1.25)*_,p=s+Math.sin(l)*c*d+Math.sin(l+h*1.25)*_;e.strokeStyle="rgb(96,72,50)",e.lineWidth=1.1,e.beginPath(),e.moveTo(a+Math.cos(l)*c*d,s+Math.sin(l)*c*d),e.lineTo(T,p),e.stroke();let m=f+(t()-.5)*36;for(let v=0;v<o.needles;v++){let x=v/o.needles*Math.PI*2+t()*.5,g=o.len[0]+t()*(o.len[1]-o.len[0]);e.strokeStyle=Di(m+(t()-.5)*24,.85),e.lineWidth=1.8,e.beginPath(),e.moveTo(T,p),e.lineTo(T+Math.cos(x)*g,p+Math.sin(x)*g),e.stroke()}i.length<o.cones&&t()<.1&&i.push([T,p])}}for(let[a,s]of i){e.fillStyle="rgb(150,160,120)",e.beginPath(),e.ellipse(a,s-9,6.5,10,0,0,Math.PI*2),e.fill(),e.strokeStyle="rgba(96,104,72,0.9)",e.lineWidth=.9;for(let l=-2;l<=2;l++)e.beginPath(),e.moveTo(a-6,s-9+l*3.4),e.lineTo(a+6,s-9+l*3.4),e.stroke()}r(e,1)}var fr={holly:{paint:ux,seed:53,needles:!1},hawthorn:{paint:dx,seed:59,needles:!1},beech:{paint:hx,seed:61,needles:!1},spruce:{paint:px,seed:71,needles:!0},scots:{paint:mx,seed:73,needles:!0},cedar:{paint:gx,seed:79,needles:!0}};var Je=e=>Number(e).toFixed(3),Uo=qs.bark,pn=qs.leaves;function He(e){return()=>{e|=0,e=e+1831565813|0;let n=Math.imul(e^e>>>15,1|e);return n=n+Math.imul(n^n>>>7,61|n)^n,((n^n>>>14)>>>0)/4294967296}}function Pl(e,n,t){let r=e.attributes.position,o=new Map;for(let i=0;i<r.count;i++){let a=`${r.getX(i).toFixed(3)},${r.getY(i).toFixed(3)},${r.getZ(i).toFixed(3)}`;o.has(a)||o.set(a,[(t()-.5)*n,(t()-.5)*n,(t()-.5)*n]);let[s,l,f]=o.get(a);r.setXYZ(i,r.getX(i)+s,r.getY(i)+l,r.getZ(i)+f)}return e.computeVertexNormals(),e}function _x(e,n,t,r=12,o=!1){let i=(o?[[.12,-n*.28],[e,-n*.46],[e*.45,n*.06],[.001,n*.5]]:[[.12,-n*.28],[e*.45,-n*.4],[e*.88,-n*.5],[e,-n*.46],[e*.62,-n*.1],[e*.3,n*.22],[.001,n*.5]]).map(([f,c])=>new je(f,c)),a=new Ss(i,r).toNonIndexed(),s=Array.from({length:r+1},()=>.8+t()*.35);s[r]=s[0];let l=a.attributes.position;for(let f=0;f<l.count;f++){let c=l.getX(f),u=l.getZ(f),h=(Math.atan2(c,u)+Math.PI*2)%(Math.PI*2)/(Math.PI*2)*r,_=Math.floor(h),T=h-_,p=s[_]*(1-T)+s[(_+1)%r]*T,m=Math.min(1,Math.hypot(c,u)/e),v=1+(p-1)*m;l.setXYZ(f,c*v,l.getY(f)-(p-1)*m*n*.25,u*v)}return a.computeVertexNormals(),a}function Ll(e,n,t=12,r=!1){let o=Ve(e.map(([l,f,c,u,d])=>{let h=_x(l,f,n,t,r);h.scale(.88+n()*.24,1,.88+n()*.24),h.rotateY(n()*Math.PI),h.translate(u,c,d),Pl(h,.25,n),h.deleteAttribute("normal"),h.deleteAttribute("uv");let _=Tl(h,.001);return _.computeVertexNormals(),_.toNonIndexed()})),i=sn(o,e.length*3,n,{low:1,high:10}),a=i.attributes.normal,s=i.attributes.color;for(let l=0;l<s.count;l++){let f=1-vx*Math.max(0,-a.getY(l));s.setXYZ(l,s.getX(l)*f,s.getY(l)*f,s.getZ(l)*f)}return i}var vx=.45,Xh=.75;function Wi(e,n,t=!0,r=2,o=null,i=r){let a=Ve(e.map(([s,l,f,c])=>{let u=new ui(c,r),d=[.85+n()*.3,.8+n()*.3,.85+n()*.3];u.scale(...d);let h=i!==r?(Pl(new ui(c,i),.35,n),He(Math.round((s*31+l*17+f*13+c*7)*1e3)>>>0)):n,_=u.attributes.position;for(let p=0;p<_.count;p++)_.getY(p)<0&&_.setY(p,_.getY(p)*Xh);if(o&&u.scale(o.across,o.up,o.across),u.translate(s,l,f),Pl(u,.35,h),!t)return u;u.deleteAttribute("normal"),u.deleteAttribute("uv");let T=Tl(u,.001);return T.computeVertexNormals(),T.toNonIndexed()}));return xx(sn(a,e.length,n,{low:3,high:8}),e)}var Sx=.8;function xx(e,n,t=Sx){let r=e.attributes.normal;if(!r||n.length<2||t<=0)return e;let o=e.attributes.position,[i,a,s,l]=[0,0,0,0];for(let[u,d,h,_]of n){let T=_*_*_;i+=u*T,a+=d*T,s+=h*T,l+=T}let f=new te,c=new te;for(let u=0;u<o.count;u++)f.set(o.getX(u)-i/l,o.getY(u)-a/l,o.getZ(u)-s/l).normalize(),c.set(r.getX(u),r.getY(u),r.getZ(u)).lerp(f,t).normalize(),r.setXYZ(u,c.x,c.y,c.z);return e}function $h(e,n){return Kh(zl(e,n),e.width,e.height)}function zl(e,n){let{width:t,height:r}=e,o=e.getContext("2d").getImageData(0,0,t,r).data,[i,a,s]=Mx(o,n),l=new Uint8Array(t*r*4);for(let f=0;f<r;f++){let c=(r-1-f)*t*4,u=f*t*4;for(let d=0;d<t*4;d+=4){let h=o[c+d+3],_=h>=Ex;l[u+d]=_?o[c+d]:i,l[u+d+1]=_?o[c+d+1]:a,l[u+d+2]=_?o[c+d+2]:s,l[u+d+3]=h}}return l}function Kh(e,n,t){let r=new Gn(e,n,t,Qt);return r.colorSpace=Dr,r.magFilter=St,r.minFilter=Xt,r.generateMipmaps=!0,r.anisotropy=4,r.needsUpdate=!0,r}var Ex=8;function Mx(e,n){let t=0,r=0,o=0,i=0;for(let a=0;a<e.length;a+=4)e[a+3]<200||(t+=e[a],r+=e[a+1],o+=e[a+2],i++);return i?[Math.round(t/i),Math.round(r/i),Math.round(o/i)]:n}function Yh(e,n="cards",t=[1,1]){let r=new En({side:jt,alphaTest:.45,...e}),o=`#define LEAF_GRID vec2(${(14*t[0]).toFixed(1)}, ${(14*t[1]).toFixed(1)})`;return r.onBeforeCompile=i=>{i.fragmentShader=i.fragmentShader.replace("#include <normal_fragment_begin>",`#include <normal_fragment_begin>
  normal = normalize( vNormal );`),Pe&&(i.fragmentShader=wx(i.fragmentShader.replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
        ${qh}`),bx),Ot||(i.fragmentShader=i.fragmentShader.replace("#include <map_fragment>",`#include <map_fragment>
${Ax}`).replace("#include <common>",`#include <common>
${o}`)))},r.customProgramCacheKey=()=>Pe?`foliage-v7-close-${t[0]}x${t[1]}${Ot?"-p":""}`:"foliage-v1",zn(r,n),rn(r,"foliage",{kind:n,high:Pe,grid:t})}var Tx=.07,qh=Ot?"float fNear = 0.0;":`float fNear = 1.0 - smoothstep(${Je(pn.full)}, ${Je(pn.fade)}, length(vViewPosition));`,bx=`
		{
			float fBack = max( dot( -geometryViewDir, directLight.direction ), 0.0 );
			float fLobe = fBack * fBack;
			fLobe *= fLobe;
			reflectedLight.directDiffuse += diffuseColor.rgb * vec3( 1.0, 1.0, 0.8 ) * directLight.color * ( ( ${Je(Tx)} + ${Je(pn.through)} * fNear ) * fLobe );
			if ( fNear > 0.0 ) {
				// The sun on the leaf's back comes through it; and a waxy glint.
				float fThrough = max( -dot( normal, directLight.direction ), 0.0 );
				float fGlint = pow( max( dot( reflect( -directLight.direction, normal ), geometryViewDir ), 0.0 ), 36.0 );
				reflectedLight.directDiffuse += directLight.color * fNear * ( diffuseColor.rgb * vec3( 1.0, 1.0, 0.75 ) * ${Je(pn.behind)} * fThrough + mix( diffuseColor.rgb, vec3( 1.0 ), 0.4 ) * ${Je(pn.glint)} * fGlint );
			}
		}`,Ch=!1;function wx(e,n){let t=Ce.lights_fragment_begin,r="RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );",o=t.indexOf("DirectionalLight directionalLight;"),i=o<0?-1:t.indexOf(r,o);if(i<0)return Ch||console.warn("Light through the leaves: three.js's lighting isn't as expected; none."),Ch=!0,e;let a=i+r.length;return e.replace("#include <lights_fragment_begin>",`${t.slice(0,a)}
${n}${t.slice(a)}`)}var Ax=`#ifdef USE_MAP
        {
          ${qh}
          // (Gone where a leaf's patch is smaller than a few pixels, where
          // it was only sparkle that changed every frame.)
          float fSmall = 1.0 - smoothstep(0.25, 0.5, length(fwidth(vMapUv * LEAF_GRID)));
          if (fNear * fSmall > 0.0) {
            vec2 fCell = floor(vMapUv * LEAF_GRID);
            float fH = fract(sin(dot(fCell, vec2(12.9898, 78.233))) * 43758.5453);
            diffuseColor.rgb *= mix(vec3(1.0), vec3(1.0 - ${Je(pn.shade/2)} + ${Je(pn.shade)} * fH, 1.0 - ${Je(pn.shade/2.5)} + ${Je(pn.shade*.8)} * fH, 1.0 - ${Je(pn.shade/2)} + ${Je(pn.shade*.6)} * (1.0 - fH)), fNear * fSmall);
          }
        }
        #endif`,mn=(At?4:2)/(Ot?2:1);function Do(e,n,t,r,o,i,a,s){e.save(),e.translate(n,t),e.rotate(r);let l=22,f=()=>{e.beginPath(),e.moveTo(0,0);for(let c=1;c<=l;c++){let u=c/l,d=Math.sin(u*Math.PI),h=a?.7+.3*Math.max(0,Math.sin(u*a*Math.PI)):1;e.lineTo(u*o,i*d*h)}for(let c=l;c>=0;c--){let u=c/l,d=Math.sin(Math.max(u,.001)*Math.PI),h=a?.7+.3*Math.max(0,Math.sin(u*a*Math.PI)):1;e.lineTo(u*o,-i*d*h)}e.closePath()};e.save(),e.globalCompositeOperation="source-atop",e.translate(o*.05,o*.06),f(),e.fillStyle=`rgba(18,30,12,${Dl.shade})`,e.fill(),e.restore(),f(),e.fillStyle=`rgb(${s*.42|0},${s*.7|0},${s*.3|0})`,e.fill(),e.fillStyle=`rgb(${s*.6|0},${s*.95|0},${s*.42|0})`,e.save(),e.translate(o*.14,0),e.scale(.66,.5),e.fill(),e.restore(),e.strokeStyle=`rgba(${Math.min(255,s*.75)|0},${Math.min(255,s)|0},${s*.35|0},0.8)`,e.lineWidth=Math.max(.45,o*.02),e.beginPath(),e.moveTo(o*.08,0),e.lineTo(o*.88,0),e.stroke(),e.globalCompositeOperation="source-atop",e.lineWidth=Math.max(.3,o*.011),e.beginPath();for(let c of Dl.veins){let u=i*Math.sin(c*Math.PI)*.62;for(let d of[-1,1])e.moveTo(o*c,0),e.lineTo(o*(c+.11),d*u)}e.stroke(),e.restore()}var Dl={shade:.22,veins:[.28,.46,.64]};function Ph(e,n){let t=Zh,r=(i,a,s)=>{let f=u=>a*(u<t.widest?Math.pow(u/t.widest,1.35):Math.pow(Math.max(0,(1-u)/(1-t.widest)),.55)),c=()=>{e.beginPath(),e.moveTo(0,0);for(let u=1;u<=18;u++)e.lineTo(u/18*i,f(u/18));for(let u=18;u>=0;u--)e.lineTo(u/18*i,-f(u/18));e.closePath()};e.save(),e.globalCompositeOperation="source-atop",e.translate(i*.04,i*.05),c(),e.fillStyle=`rgba(18,30,12,${Dl.shade})`,e.fill(),e.restore(),c(),e.fillStyle=`rgb(${s*.42|0},${s*.7|0},${s*.3|0})`,e.fill(),e.save(),e.translate(i*.16,0),e.scale(.72,.52),c(),e.fillStyle=`rgb(${s*.6|0},${s*.95|0},${s*.42|0})`,e.fill(),e.restore(),e.save(),e.globalCompositeOperation="source-atop",e.strokeStyle=`rgba(${Math.min(255,s*.78)|0},${Math.min(255,s*1.02)|0},${s*.36|0},0.85)`,e.lineWidth=Math.max(.5,i*.022),e.beginPath(),e.moveTo(0,0),e.lineTo(i*.94,0),e.stroke(),e.strokeStyle=`rgba(${s*.3|0},${s*.5|0},${s*.2|0},0.45)`,e.lineWidth=Math.max(.35,i*.011),e.beginPath();for(let u=0;u<t.ribs;u++){let d=.2+u/t.ribs*.68;for(let h of[-1,1])e.moveTo(i*d,0),e.lineTo(i*(d+.09),h*f(d+.09)*.86)}e.stroke(),e.restore()};return(i,a,s,l,f)=>{e.save(),e.translate(i,a),e.rotate(s),e.strokeStyle=`rgb(${f*.5|0},${f*.62|0},${f*.28|0})`,e.lineWidth=1.3,e.beginPath(),e.moveTo(0,0),e.lineTo(-l*.5,0),e.stroke();let c=t.leaflets[0]+Math.floor(n()*(t.leaflets[1]-t.leaflets[0]+1)),u=Array.from({length:c},(d,h)=>h).sort((d,h)=>Math.abs(h-(c-1)/2)-Math.abs(d-(c-1)/2));for(let d of u){let h=c>1?d/(c-1)*2-1:0,_=l*(1-t.shorter*h*h)*(.94+n()*.12);e.save(),e.rotate(h*t.fan+(n()-.5)*.08),r(_,_*t.wide,f*(1-.14*Math.abs(h))*(.95+n()*.1)),e.restore()}e.restore()}}var Zh={hands:16,reach:[44,62],leaflets:[5,7],fan:1.75,shorter:.42,wide:.19,widest:.66,ribs:7,spread:.33},Rx={rings:[[6,.1,.4,100,.2],[4,.04,.27,138,.9]]};function Lo(e,n,t,{count:r,len:o,wid:i,lobes:a=0,v0:s,v1:l,spread:f=.34}){let c=[];for(let u=0;u<r;u++){let d=t()*Math.PI*2,h=n*f*Math.sqrt(t()),_=o[0]+t()*(o[1]-o[0]);c.push([n/2+Math.cos(d)*h,n/2+Math.sin(d)*h,t()*Math.PI*2,_,_*i,a,s+t()*(l-s)])}c.sort((u,d)=>u[6]-d[6]);for(let u of c)Do(e,...u)}var jh=new Map;function Qh(e,n){return jh.set(e,n),e.onUpdate=()=>{e.image.data=null},e}function B2(){for(let[e,n]of jh)e.image.data=n(),e.needsUpdate=!0}var Ui=null;function Jh(e){if(Ui??={},Ui[e])return Ui[e];let n=Qh($h(Il(e),Xi(e)),()=>zl(Il(e),Xi(e)));return e==="willow"&&(n.wrapS=fn,n.wrapT=fn),Ui[e]=n,n}var Xi=e=>e==="pine"||fr[e]?.needles?[60,95,45]:e==="willow"?[110,130,60]:[80,115,50],at={cols:4,rows:4,kinds:["pine","leaf","birch","willowleaf","poplar","bush","oak","plane","chestnut","chestnutwhorl",...Object.keys(fr)]},Ii=null;function Wl(){if(Ii)return Ii;let{data:e,w:n,h:t}=Lh();return Ii=Qh(Kh(e,n,t),()=>Lh().data),Ii}function Lh(){let e=256*mn,n=e*at.cols,t=e*at.rows,r=new Uint8Array(n*t*4),[o,i,a]=Xi("leaf");for(let s=0;s<n*t*4;s+=4)r[s]=o,r[s+1]=i,r[s+2]=a;return at.kinds.forEach((s,l)=>{let f=zl(Il(s),Xi(s)),c=l%at.cols*e,u=Math.floor(l/at.cols)*e;for(let d=0;d<e;d++)r.set(f.subarray(d*e*4,(d+1)*e*4),((u+d)*n+c)*4);ep[s]=yx(f,e)}),{data:r,w:n,h:t}}var Ni=.025,ep={};function yx(e,n){let t=Math.ceil(nc*255),[r,o,i,a]=[n,n,-1,-1];for(let s=0;s<n;s++)for(let l=0;l<n;l++)e[(s*n+l)*4+3]<t||(r=Math.min(r,l),i=Math.max(i,l),o=Math.min(o,s),a=Math.max(a,s));return i<0?null:[Math.max(0,r/n-Ni),Math.max(0,o/n-Ni),Math.min(1,(i+1)/n+Ni),Math.min(1,(a+1)/n+Ni)]}var Cx=[[0,1],[1,1],[0,0],[1,0]];function Px(e,n){if(!e||!n)return e;Kl(e);let[t,r,o,i]=n,a=[[t,i],[o,i],[t,r],[o,r]],s=e.attributes.uv,l=Object.values(e.attributes);for(let f=0;f+3<s.count;f+=4)if(Cx.every(([c,u],d)=>s.getX(f+d)===c&&s.getY(f+d)===u))for(let c of l)for(let u=0;u<c.itemSize;u++){let[d,h,_,T]=[0,1,2,3].map(p=>c.getComponent(f+p,u));a.forEach(([p,m],v)=>{let x=d+(h-d)*p,g=_+(T-_)*p;c.setComponent(f+v,u,g+(x-g)*m)})}for(let f of l)f.needsUpdate=!0;return e.boundingBox=null,e.boundingSphere=null,e}var Wt=(e,n)=>e==="leaf"&&ap.has(n)?"plane":gn[e].texture,Jr=e=>at.kinds.includes(e)?"leaves":e,Ul=e=>at.kinds.includes(e)?Wl():Jh(e);function mr(e,n){if(!e)return e;let t=Math.max(0,at.kinds.indexOf(n)),r=e.attributes.position.count,o=new Float32Array(r*2);for(let i=0;i<r;i++)o[i*2]=t%at.cols/at.cols,o[i*2+1]=Math.floor(t/at.cols)/at.rows;return e.setAttribute("fCell",new Oe(o,2)),e}function Io(e,n,t=256*mn){let r=at.kinds.indexOf(n);if(!e||r<0||e.userData.atlas)return e;Wl(),Px(e,ep[n]);let o=e.attributes.uv,i=.5/t,a=r%at.cols,s=Math.floor(r/at.cols);for(let l=0;l<o.count;l++)o.setXY(l,(a+i+o.getX(l)*(1-2*i))/at.cols,(s+i+o.getY(l)*(1-2*i))/at.rows);return o.needsUpdate=!0,e.userData.atlas=n,e}function Il(e){let t=document.createElement("canvas");t.width=t.height=256*mn;let r=t.getContext("2d",{willReadFrequently:!0});r.scale(mn,mn);let o=He(e==="pine"?5:e==="willow"?13:e==="oak"?9:e==="birch"?17:e==="poplar"?23:e==="bush"?29:e==="willowleaf"?31:e==="plane"?41:e==="chestnut"?43:e==="chestnutwhorl"?47:fr[e]?.seed??37);if(fr[e])fr[e].paint(r,256,o,{paintLeaf:Do,dilate:on});else if(e==="willow"){for(let a=0;a<3;a++){let s=256*(.2+a*.3);for(let l=0;l<5;l++){let f=l/5*256,c=Math.PI/2+(o()-.5)*.15,u=256/5+20+o()*6,d=6.5,h=138+o()*55,_=s+(o()-.5)*12;Do(r,_,f,c,u,d,0,h),Do(r,_+(o()-.5)*16,f+u*.32,c+(o()-.5)*.2,u*.75,d*.8,0,h-15),f+u>254&&Do(r,_,f-256,c,u,d,0,h)}}on(r,1)}else if(e==="pine"){for(let i=0;i<8;i++){let a=o()*Math.PI*2,s=256*(.3+o()*.4),l=256*(.3+o()*.4),f=256*(.22+o()*.1),c=s+Math.cos(a)*f,u=l+Math.sin(a)*f;r.strokeStyle="rgb(78,58,34)",r.lineWidth=2,r.beginPath(),r.moveTo(s,l),r.lineTo(c,u),r.stroke();for(let d=1;d<=18;d++){let h=d/18,_=s+(c-s)*h,T=l+(u-l)*h,p=14+o()*18,m=90+o()*60;for(let v of[-1,1]){let x=a+v*(.5+o()*.2);r.strokeStyle=`rgb(${m*.38|0},${m*.7|0},${m*.3|0})`,r.lineWidth=2.6,r.beginPath(),r.moveTo(_,T),r.lineTo(_+Math.cos(x)*p,T+Math.sin(x)*p),r.stroke()}}}on(r,1)}else if(e==="oak"){let i=(a,s,l,f)=>{r.save(),r.translate(a,s),r.rotate(l);let c=3,u=f*.62;r.beginPath(),r.moveTo(0,0);for(let h=1;h<=28;h++){let _=h/28,T=Math.sin(_*Math.PI),p=.7+.3*Math.max(0,Math.sin(_*c*Math.PI));r.lineTo(_*f,u*T*p)}for(let h=28;h>=0;h--){let _=h/28,T=Math.sin(Math.max(_,.001)*Math.PI),p=.7+.3*Math.max(0,Math.sin(_*c*Math.PI));r.lineTo(_*f,-u*T*p)}r.closePath();let d=100+o()*70;r.fillStyle=`rgb(${d*.4|0},${d*.68|0},${d*.28|0})`,r.fill(),r.fillStyle=`rgb(${d*.58|0},${d*.94|0},${d*.4|0})`,r.save(),r.translate(f*.14,0),r.scale(.68,.52),r.fill(),r.restore(),r.strokeStyle=`rgba(${Math.min(255,d*.8)|0},${Math.min(255,d)|0},${d*.32|0},0.85)`,r.lineWidth=.9,r.beginPath(),r.moveTo(f*.08,0),r.lineTo(f*.88,0),r.stroke(),r.restore()};for(let a=0;a<22;a++){let s=o()*Math.PI*2,l=256*.34*Math.sqrt(o());i(256/2+Math.cos(s)*l,256/2+Math.sin(s)*l,o()*Math.PI*2,34+o()*28)}on(r,2)}else if(e==="birch")Lo(r,256,o,{count:26,len:[18,32],wid:.52,v0:165,v1:225,spread:.4}),on(r,1);else if(e==="plane"){let i=(a,s,l,f,c)=>{r.save(),r.translate(a,s),r.rotate(l),r.beginPath();let u=60;for(let d=0;d<=u;d++){let h=-Math.PI*.92+d/u*Math.PI*1.84,_=Math.pow(Math.abs(Math.cos(h*2.5)),.7),T=f*(.38+.62*_)*(.75+.25*Math.cos(h*.5)),p=Math.cos(h)*T,m=Math.sin(h)*T;d?r.lineTo(p,m):r.moveTo(p,m)}r.lineTo(-f*.12,0),r.closePath(),r.fillStyle=`rgb(${c*.42|0},${c*.7|0},${c*.3|0})`,r.fill(),r.save(),r.scale(.66,.66),r.fillStyle=`rgb(${c*.6|0},${c*.95|0},${c*.42|0})`,r.fill(),r.restore(),r.strokeStyle=`rgba(${Math.min(255,c*.75)|0},${Math.min(255,c)|0},${c*.35|0},0.8)`,r.lineWidth=.8;for(let d of[0,.4,-.4,.8,-.8])r.beginPath(),r.moveTo(-f*.1,0),r.lineTo(Math.cos(d*Math.PI)*f*.85,Math.sin(d*Math.PI)*f*.85),r.stroke();r.beginPath(),r.moveTo(-f*.1,0),r.lineTo(-f*.55,0),r.stroke(),r.restore()};for(let a=0;a<18;a++){let s=o()*Math.PI*2,l=256*.34*Math.sqrt(o());i(256/2+Math.cos(s)*l,256/2+Math.sin(s)*l,o()*Math.PI*2,17+o()*11,100+o()*70)}on(r,2)}else if(e==="chestnut"){let i=Zh,a=Ph(r,o),s=[];for(let l=0;l<i.hands;l++){let f=o()*Math.PI*2,c=256*i.spread*Math.sqrt(o());s.push([256/2+Math.cos(f)*c,256/2+Math.sin(f)*c,o()*Math.PI*2,i.reach[0]+o()*(i.reach[1]-i.reach[0]),96+o()*78])}s.sort((l,f)=>l[4]-f[4]);for(let l of s)a(...l);on(r,2)}else if(e==="chestnutwhorl"){let i=Rx,a=Ph(r,o),s=256/2;for(let[l,f,c,u,d]of i.rings)for(let h=0;h<l;h++){let _=d+h/l*Math.PI*2+(o()-.5)*.25;a(s+Math.cos(_)*256*f,s+Math.sin(_)*256*f,_,256*c*(.94+o()*.1),u+o()*30)}on(r,2)}else e==="poplar"?(Lo(r,256,o,{count:48,len:[22,40],wid:.42,v0:90,v1:155,spread:.4}),on(r,1)):e==="bush"?(Lo(r,256,o,{count:36,len:[18,34],wid:.7,v0:110,v1:175,spread:.4}),on(r,1)):e==="willowleaf"?(Lo(r,256,o,{count:20,len:[36,64],wid:.2,v0:130,v1:190,spread:.32}),on(r,1)):(Lo(r,256,o,{count:30,len:[28,50],wid:.46,v0:100,v1:170,spread:.38}),on(r,2));return t}function on(e,n){let{width:t,height:r}=e.canvas,o=e.getImageData(0,0,t,r);Ah(o.data,o.data,t,r,n),e.save(),e.setTransform(1,0,0,1,0,0),e.putImageData(o,0,0),e.restore()}function Lx(e,n,t,r){let o=n+t/2,i=t*.97,a=t*.04;e.strokeStyle="rgb(150,185,120)",e.lineWidth=2.2,e.beginPath(),e.moveTo(o,i),e.lineTo(o,a+6),e.stroke();let s=l=>t*.27*(l<.3?.4+.6*(l/.3):Math.pow((1-l)/.7,.75));for(let l=0;l<190;l++){let f=.05+.95*(l/190),c=s(f),u=o+(r()*2-1)*c,d=i+(a-i)*f+(r()-.5)*3,h=2.5+r()*1.6-f*.9,_=226+r()*29;e.fillStyle=`rgb(${_},${_},${_-6|0})`;for(let T=0;T<4;T++){let p=T/4*Math.PI*2+r()*1.5;e.beginPath(),e.arc(u+Math.cos(p)*h*.9,d+Math.sin(p)*h*.9,h,0,Math.PI*2),e.fill()}e.fillStyle=r()<.5?"rgb(235,200,90)":"rgb(225,120,135)",e.beginPath(),e.arc(u,d,h*.42,0,Math.PI*2),e.fill()}}var Oi=null,Xl=2;function tp(){if(Oi)return Oi;let e=128,n=document.createElement("canvas");n.width=e*mn*Xl,n.height=e*mn;let t=n.getContext("2d",{willReadFrequently:!0});t.scale(mn,mn),Lx(t,e,e,He(67));let r=He(61);for(let o=0;o<110;o++){let i=r()*Math.PI*2,a=e*.4*Math.sqrt(r()),s=e/2+Math.cos(i)*a,l=e/2+Math.sin(i)*a,f=220+r()*35,c=2.4+r()*1.4;t.fillStyle=`rgb(${f},${f},${f})`;for(let u=0;u<5;u++){let d=u/5*Math.PI*2+r();t.beginPath(),t.arc(s+Math.cos(d)*c,l+Math.sin(d)*c,c*.85,0,Math.PI*2),t.fill()}t.fillStyle="rgb(120,110,80)",t.beginPath(),t.arc(s,l,c*.45,0,Math.PI*2),t.fill()}return Oi=$h(n,[200,200,200]),Oi}function ki(e,n,t,r,o=0){let i=[];for(let[a,s,l,f]of e)for(let c=0;c<n;c++){let u=(c+.5)/n,d=Math.acos(1-2*u)+(r()-.5)*.3,h=c*2.39996+r()*.5,_=new te(Math.sin(d)*Math.cos(h),Math.cos(d),Math.sin(d)*Math.sin(h)),T=t*f*(.8+r()*.5),p=new Lt(T,T),m=new Kt().setFromUnitVectors(new te(0,0,1),_);m.multiply(new Kt().setFromAxisAngle(new te(0,0,1),r()*Math.PI*2)),p.applyQuaternion(m);let v=.85+r()*.25;o&&(v-=o*r()),_.y<0&&(v/=Math.hypot(_.x,_.z,_.y/Xh));let x=_.clone().multiplyScalar(f*v).add(new te(a,s,l));p.translate(x.x,x.y,x.z);let g=p.attributes.position,M=p.attributes.normal;for(let b=0;b<g.count;b++){let A=new te(g.getX(b)-a,g.getY(b)-s,g.getZ(b)-l).normalize();M.setXYZ(b,A.x,A.y,A.z)}i.push(p)}return sn(Ve(i),i.length,r,{low:3,high:8.5})}function Nl(e,n,t,r){let o=[];for(let[i,a,s,l]of e)for(let f=0;f<n;f++){let c=r()*Math.PI*2,u=l*(.15+.9*Math.pow(r(),.5)),d=(r()-.28)*l,h=t*l*(.7+r()*.5),_=new Lt(h,h*(.8+r()*.3)),T=new te(Math.cos(c),.25+r()*.55,Math.sin(c)).normalize(),p=new Kt().setFromUnitVectors(new te(0,0,1),T);p.multiply(new Kt().setFromAxisAngle(new te(0,0,1),r()*Math.PI)),_.applyQuaternion(p),_.translate(i+Math.cos(c)*u,a+d,s+Math.sin(c)*u);let m=_.attributes.position,v=_.attributes.normal;for(let x=0;x<m.count;x++){let g=new te(m.getX(x)-i,(m.getY(x)-a)*.5+.45,m.getZ(x)-s).normalize();v.setXYZ(x,g.x,g.y,g.z)}o.push(_)}return sn(Ve(o),o.length,r,{low:3,high:8.5})}var Dx={out:[.8,.62],size:[.62,.45],drop:[.55,-.35]};function Ux(e,n,t=Dx){let[r,o,i,a,s]=e[0],l=e.at(-1);return[[r*t.size[0],o*.8,i-t.drop[0],a+Math.cos(n)*r*t.out[0],s+Math.sin(n)*r*t.out[0]],[r*t.size[1],o*.7,(i+l[2])/2-t.drop[1],a-Math.cos(n+.5)*r*t.out[1],s-Math.sin(n+.5)*r*t.out[1]]]}function yl(e,n,t,r,o,i,a){if(e!=="scots"||!r)return r;let s=Ux(o,(n*7+t*13)%20*.314),l=s.map(([f,,c,u,d])=>[u,c,d,f]);return Ve([r,an(qr(s,He(23559+a*101+t*31),i),l)])}function qr(e,n,{every:t=1,grow:r=1,deep:o=null,under:i=0}={}){let a=la(e),s=[];for(let[c,u,d,h,_]of a){let T=Math.max(3,Math.round(d/t));for(let p=0;p<T;p++){if(n()<.12)continue;let m=p/T*Math.PI*2+n()*.4,v=(1.5+c*.45)*(.8+n()*.4)*1.28*r,x=new Lt(v,v*.8);x.rotateX(-Math.PI/2+.55+n()*.2),x.translate(0,0,c*(o?o[0]+n()*(o[1]-o[0]):.55+n()*.15)),x.rotateY(-m),x.translate(h,u-.6+n()*.4,_);let g=x.attributes.position,M=x.attributes.normal;for(let b=0;b<g.count;b++){let A=new te(g.getX(b)-h,.6,g.getZ(b)-_).normalize();M.setXYZ(b,A.x,A.y,A.z)}s.push(x)}}let l=sn(Ve(s),s.length,n,{low:1,high:10});if(!i)return l;let f=Nx(e,{count:i/t,grow:r});return Ve([l,Ox(e,{count:i/t,grow:r}),...f?[f]:[]])}var ur={gap:.45,from:.3,to:.65,perMetre:2.5,least:4},Ix=e=>(1.5+e*.45)*1.28*.8;function Nx(e,{count:n=1,grow:t=1}={}){let r=He(Math.round(e.reduce((a,[s,l,f])=>a+s*131+l*17+f*7,0)*1e3)^28702),o=la(e).sort((a,s)=>a[1]-s[1]),i=[];for(let a=1;a<o.length;a++){let[s,l,,f,c]=o[a-1],[u,d,,h,_]=o[a],T=(s+u)/2;if(d-l<=ur.gap*Ix(T))continue;let[p,m,v]=[(l+d)/2,(f+h)/2,(c+_)/2],x=Math.max(ur.least,Math.round((ur.least+T*ur.perMetre)*n));for(let g=0;g<x;g++){let M=g/x*Math.PI*2+r()*.5,b=(1.5+T*.45)*(.8+r()*.4)*1.28*t,A=new Lt(b,b*.8);A.rotateX(-Math.PI/2+.55+r()*.2),A.translate(0,0,T*(ur.from+r()*(ur.to-ur.from))),A.rotateY(-M),A.translate(m,p-.6+r()*.4,v);let S=A.attributes.position,w=A.attributes.normal;for(let y=0;y<S.count;y++){let P=new te(S.getX(y)-m,.6,S.getZ(y)-v).normalize();w.setXYZ(y,P.x,P.y,P.z)}i.push(A)}}return i.length?sn(Ve(i),i.length,r,{low:1,high:10}):null}var $n={perMetre:2.6,from:.3,to:.75,size:.8,shade:.72};function Ox(e,{count:n=1,grow:t=1}={}){let r=He(Math.round(e.reduce((s,[l,f,c])=>s+l*131+f*17+c*7,0)*1e3)^3342),o=[];for(let[s,l,f,c,u]of e){let d=Math.max(3,Math.round(s*$n.perMetre*n));for(let h=0;h<d;h++){if(r()<.1)continue;let _=h/d*Math.PI*2+r()*.5,T=$n.from+r()*($n.to-$n.from),p=(1.5+s*.45)*(.8+r()*.4)*1.28*$n.size*t,m=new Lt(p,p*.8);m.rotateX(-Math.PI/2+.15+r()*.2),m.translate(0,0,s*T),m.rotateY(-_),m.translate(c,f-l*(.3+.22*T)-.1,u);let v=m.attributes.position,x=m.attributes.normal;for(let g=0;g<v.count;g++){let M=new te(v.getX(g)-c,-.5,v.getZ(g)-u).normalize();x.setXYZ(g,M.x,M.y,M.z)}o.push(m)}}let i=sn(Ve(o),o.length,r,{low:1,high:10}),a=i.attributes.color;for(let s=0;s<a.count;s++)a.setXYZ(s,a.getX(s)*$n.shade,a.getY(s)*$n.shade,a.getZ(s)*$n.shade);return i}var No={pine:[{name:"dark green",hue:[.292,.347],sat:[.35,.45],light:[.24,.32],weight:4},{name:"blue-grey",hue:[.4,.46],sat:[.18,.3],light:[.3,.38],weight:1.5},{name:"deep",hue:[.31,.36],sat:[.3,.4],light:[.18,.24],weight:1},{name:"yellow-green",hue:[.25,.29],sat:[.3,.4],light:[.27,.33],weight:.9}],leaf:[{name:"mid green",hue:[.236,.292],sat:[.38,.5],light:[.3,.4],weight:4},{name:"fresh",hue:[.2,.25],sat:[.48,.6],light:[.36,.44],weight:2},{name:"deep",hue:[.27,.33],sat:[.35,.45],light:[.22,.29],weight:2},{name:"olive",hue:[.15,.2],sat:[.35,.45],light:[.3,.37],weight:1.2},{name:"silvery",hue:[.24,.3],sat:[.12,.22],light:[.38,.46],weight:.8},{name:"copper beech",hue:[.96,1],sat:[.25,.38],light:[.2,.27],weight:.25},{name:"lime",hue:[.19,.23],sat:[.5,.6],light:[.38,.45],weight:.7},{name:"blue-green",hue:[.3,.36],sat:[.26,.36],light:[.26,.33],weight:.9},{name:"turning",hue:[.09,.13],sat:[.5,.62],light:[.34,.42],weight:.12}],birch:[{name:"fresh",hue:[.19,.24],sat:[.45,.58],light:[.38,.46],weight:3},{name:"mid",hue:[.23,.27],sat:[.38,.5],light:[.33,.4],weight:2},{name:"turning",hue:[.12,.16],sat:[.5,.6],light:[.38,.45],weight:.3},{name:"deep",hue:[.24,.29],sat:[.35,.45],light:[.28,.34],weight:1}],willow:[{name:"yellow-green",hue:[.17,.22],sat:[.4,.55],light:[.38,.46],weight:3},{name:"silvery",hue:[.2,.26],sat:[.18,.3],light:[.4,.47],weight:1.5}],poplar:[{name:"deep",hue:[.26,.31],sat:[.35,.45],light:[.24,.3],weight:2},{name:"fresh",hue:[.22,.26],sat:[.42,.54],light:[.32,.4],weight:1.5},{name:"silvery",hue:[.22,.28],sat:[.14,.24],light:[.36,.43],weight:.6}],bush:[{name:"dark",hue:[.28,.34],sat:[.3,.42],light:[.2,.27],weight:3},{name:"glossy",hue:[.3,.36],sat:[.35,.48],light:[.24,.3],weight:2},{name:"yellow-green",hue:[.2,.24],sat:[.35,.48],light:[.28,.35],weight:1.5},{name:"golden",hue:[.14,.18],sat:[.5,.62],light:[.36,.44],weight:.6},{name:"blue-grey",hue:[.42,.48],sat:[.14,.24],light:[.3,.37],weight:.8},{name:"purple-leaved",hue:[.93,.99],sat:[.25,.38],light:[.2,.27],weight:.4},{name:"silvery",hue:[.24,.3],sat:[.1,.18],light:[.4,.47],weight:.4}],scots:[{name:"yellow-green",hue:[.22,.27],sat:[.28,.38],light:[.27,.34],weight:3},{name:"grey-green",hue:[.27,.32],sat:[.18,.28],light:[.28,.34],weight:1.5}],oak:[{name:"mid green",hue:[.22,.28],sat:[.35,.47],light:[.27,.36],weight:3},{name:"deep",hue:[.26,.31],sat:[.32,.42],light:[.22,.28],weight:2},{name:"olive",hue:[.16,.21],sat:[.32,.42],light:[.28,.34],weight:1},{name:"fresh",hue:[.2,.24],sat:[.42,.52],light:[.32,.4],weight:1}],column:[{name:"yew",hue:[.36,.42],sat:[.25,.36],light:[.15,.19],weight:3},{name:"cypress",hue:[.3,.36],sat:[.28,.38],light:[.16,.2],weight:1.5}],spruce:[{name:"blue-green",hue:[.38,.45],sat:[.2,.32],light:[.23,.3],weight:3},{name:"dark",hue:[.33,.39],sat:[.25,.35],light:[.2,.26],weight:1.5},{name:"silver-blue",hue:[.45,.5],sat:[.15,.25],light:[.32,.38],weight:.6}],snag:[{name:"bare twigs",hue:[.07,.12],sat:[.1,.18],light:[.3,.38],weight:1}],beech:[{name:"bright",hue:[.21,.26],sat:[.45,.56],light:[.3,.38],weight:3},{name:"deep",hue:[.24,.29],sat:[.36,.46],light:[.25,.31],weight:1.5},{name:"copper",hue:[.93,.98],sat:[.24,.34],light:[.16,.21],weight:.65}],chestnut:[{name:"dark",hue:[.27,.32],sat:[.38,.48],light:[.25,.31],weight:3},{name:"mid",hue:[.25,.29],sat:[.42,.52],light:[.3,.36],weight:1.5}],cedar:[{name:"blue-green",hue:[.36,.43],sat:[.18,.28],light:[.21,.27],weight:3},{name:"silvery",hue:[.4,.47],sat:[.12,.2],light:[.3,.36],weight:1}],holly:[{name:"dark glossy",hue:[.29,.35],sat:[.32,.44],light:[.16,.21],weight:3},{name:"variegated",hue:[.17,.22],sat:[.3,.42],light:[.3,.36],weight:.4}],hawthorn:[{name:"fresh",hue:[.21,.26],sat:[.4,.5],light:[.28,.35],weight:3},{name:"grey-green",hue:[.24,.29],sat:[.24,.34],light:[.27,.33],weight:1.2}]},Fx={share:.0125};No.accent=[{name:"gold",hue:[.11,.14],sat:[.5,.62],light:[.36,.43],weight:1.2},{name:"copper",hue:[.03,.065],sat:[.42,.55],light:[.27,.33],weight:1}];var Hx=new Set([ht.leaf,ht.birch,ht.willow,ht.poplar,ht.oak,ht.beech,ht.chestnut,ht.hawthorn]);No.autumn=[...No.accent,{name:"rust",hue:[.07,.095],sat:[.5,.62],light:[.3,.36],weight:1},{name:"red",hue:[0,.025],sat:[.45,.6],light:[.28,.34],weight:.5},{name:"turning",hue:[.15,.19],sat:[.45,.55],light:[.32,.38],weight:1.1}];No.dead=[{name:"dead leaves",hue:[.05,.1],sat:[.3,.42],light:[.24,.3],weight:1}];var np=[{name:"pink",hue:[.93,.97],sat:[.55,.75],light:[.72,.8],weight:3},{name:"magenta",hue:[.87,.92],sat:[.55,.7],light:[.55,.65],weight:1.5},{name:"white",hue:[.1,.16],sat:[.1,.3],light:[.9,.95],weight:2},{name:"lilac",hue:[.74,.8],sat:[.35,.55],light:[.7,.78],weight:1.5},{name:"red",hue:[.98,1],sat:[.6,.75],light:[.45,.52],weight:1},{name:"yellow",hue:[.13,.16],sat:[.75,.9],light:[.55,.62],weight:1.2},{name:"orange",hue:[.06,.09],sat:[.7,.85],light:[.55,.62],weight:.4}];function pr(e,n,t=new ye,r=No[e]){let o=n()*r.reduce((s,l)=>s+l.weight,0),i=r.find(s=>(o-=s.weight)<0)??r[0],a=([s,l])=>s+n()*(l-s);return t.setHSL(a(i.hue)%1,a(i.sat),a(i.light))}function sn(e,n,t,{low:r=0,high:o=10}={}){let i=e.attributes.position,a=new Float32Array(i.count*3),s=i.count/n;for(let l=0;l<n;l++){let f=.84+t()*.28,c=(t()-.5)*.08;for(let u=Math.floor(l*s);u<Math.floor((l+1)*s);u++){let d=Math.min(1,Math.max(0,(i.getY(u)-r)/(o-r))),h=f*(.82+.22*d);a[u*3]=Math.min(1,h*(1+c)),a[u*3+1]=Math.min(1,h),a[u*3+2]=Math.min(1,h*(1-c))}}return e.setAttribute("color",new Oe(a,3)),e}var Bx={foot:.82,crown:.5,from:0,to:.5,cool:[.02,.05]},Gx={foot:.98,crown:.8,from:0,to:.5,cool:[.01,.05]},rp=e=>Ji(e,Gx);function Ji(e,n=Bx){let t=no(n.from,n.to,e),r=n.foot+(n.crown-n.foot)*t,o=n.cool[0]+(n.cool[1]-n.cool[0])*t;return[r*(1-o),r,r*(1+o)]}var kx={high:1.5,arc:.42,tint:[.72,1.12,.6]};function Vx(e,n,t=kx){let r=1-no(t.high*.25,t.high,e),o=1-no(t.arc*.4,t.arc,Math.abs(n-.5)),i=r*o;return i<=0?null:t.tint.map(a=>1+(a-1)*i)}var hr={rings:4,fine:8,sides:6,fineSides:7,flare:[0,.2,.56,1],branch:[3,4]};function Yr(e,n=null,t="furrowed",r=!1,o=!1){let i=n===!0||n==="birch"||n==="smooth"?rp:Ji,a=o?null:i,s=o?null:()=>i(1);n===!0&&(n="birch");let l=Dn[t]??0,f=He(Math.round(e.height*1e3+e.a*100)),c=n==="birch"||n==="scots"||n==="plane",u=null,d=null;if(n==="birch"){let A=Array.from({length:84},()=>f()<.2?.28+f()*.2:1);u=(S,w,y)=>S<.12?.45+S*3:A[y%12*7+w%7],d=()=>.85}else if(n==="plane"){let A=Array.from({length:84},()=>{let S=f();return S<.25?[1.45,1.42,1.2]:S<.45?[1.1,1.15,.9]:S<.6?[1.15,1.15,1.15]:[1,1,1]});u=(S,w,y)=>A[y%12*7+w%7]}else if(n==="scots"){let A=[.62,.66,.78],S=Array.from({length:84},()=>.9+f()*.18);u=(w,y,P)=>{let D=Math.min(1,Math.max(0,(w-.3)/.35)),U=S[P%12*7+y%7];return A.map(L=>(L+(1-L)*D)*U)},d=()=>[1,.97,.95]}let h=u,_=(A,S,w,y)=>{let P=h?h(A,S,w):1,D=Vx(A*e.height,(S+.5)/y);if(!D)return P;let[U,L,H]=Array.isArray(P)?P:[P,P,P];return[U*D[0],L*D[1],H*D[2]]},T=r?c?hr.fine:hr.rings:c?At?18:12:At?7:6,p=Math.min(.5,Ec(e)/e.height),m=(r?hr.flare:[0,.08,.2,.36,.56,.78,1]).map(A=>A*p);for(let A=1;A<=T;A++)m.push(p+(1-p)*(A/T));let v=r?c?hr.fineSides:hr.sides:At?12:10,[x,g]=r?hr.branch:At?[6,6]:[4,5],M=[Et(A=>Rn(e,A),A=>Tr(e,A),m.length-1,v,(A,S,w)=>_(A,S,w,v),l,{ts:m,flare:(A,S)=>Mc(e,A,S),under:a})],b=0;for(let A of e.branches)if(A.stem){let S=++b*5;M.push(Et(w=>br(e,A,w),w=>wr(A,w),T,v,u?(w,y,P)=>u(w,y,P+S):null,l,{under:a}))}else M.push(Et(S=>br(e,A,S),S=>wr(A,S),x,g,d,l,{under:s}));return Ve(M)}var zx=1.2;function Et(e,n,t,r,o=null,i=0,{ts:a=null,flare:s=null,under:l=null}={}){let f=M=>a?a[M]:M/t,c=[],u=[],d=[],h=[],_=[],T=M=>{let b=e(M),A=e(Math.min(1,M+.02)),S=e(Math.max(0,M-.02)),w=new te(A[0]-S[0],A[1]-S[1],A[2]-S[2]).normalize(),y=Math.abs(w.y)<.9?new te(0,1,0):new te(1,0,0),P=new te().crossVectors(w,y).normalize(),D=new te().crossVectors(w,P).normalize(),U=n(M),L=Math.hypot(A[0]-S[0],A[1]-S[1],A[2]-S[2])||1;return Array.from({length:r},(H,z)=>{let F=z/r*Math.PI*2,X=P.clone().multiplyScalar(Math.cos(F)).addScaledVector(D,Math.sin(F)),$=s?U*s(M,F):U,j=X;if(s){let Z=n(Math.min(1,M+.02))*s(Math.min(1,M+.02),F),ge=n(Math.max(0,M-.02))*s(Math.max(0,M-.02),F);j=X.clone().addScaledVector(w,(ge-Z)/L).normalize()}return{p:[b[0]+X.x*$,b[1]+X.y*$,b[2]+X.z*$],n:[j.x,j.y,j.z]}})},p=Array.from({length:t+1},(M,b)=>T(f(b))),m=At?.68:zx,v=Math.max(1,Math.round(2*Math.PI*n(0)/m)),x=[0];for(let M=1;M<=t;M++){let[b,A,S]=e(f(M-1)),[w,y,P]=e(f(M));x.push(x[M-1]+Math.hypot(w-b,y-A,P-S))}for(let M=0;M<t;M++)for(let b=0;b<r;b++){let A=p[M][b],S=p[M][(b+1)%r],w=p[M+1][b],y=p[M+1][(b+1)%r],P=o?o((f(M)+f(M+1))/2,b,M):1,[D,U,L]=Array.isArray(P)?P:[P,P,P],[H,z]=l?[l(f(M)),l(f(M+1))]:[null,null],F=b/r*v,X=(b+1)/r*v,$=x[M]/m,j=x[M+1]/m;for(let[Z,ge,Ee,ze]of[[A,F,$,H],[S,X,$,H],[w,F,j,z],[S,X,$,H],[y,X,j,z],[w,F,j,z]])c.push(...Z.p),u.push(...Z.n),ze?d.push(D*ze[0],U*ze[1],L*ze[2]):d.push(D,U,L),h.push(ge,Ee),_.push(i)}let g=new xt;return g.setAttribute("position",new qt(c,3)),g.setAttribute("normal",new qt(u,3)),g.setAttribute("color",new qt(d,3)),g.setAttribute("fBarkUv",new qt(h,2)),g.setAttribute("fBarkKind",new qt(_,1)),g}var Wx=`
          float bNear = 1.0 - smoothstep(${Je(Uo.full)}, ${Je(Uo.fade)}, length(vViewPosition));
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
              bUv += bView * (h - 0.55) * ${Je(Uo.depth)} * bNear * 0.5;
            }
          }`;function Xx(e){if(!Pe)return e;let n={tBark:Ao().tBark};return e.onBeforeCompile=t=>{Object.assign(t.uniforms,n),t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
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
          ${Wx}
          vec3 t = texture(tBark, vec3(bUv, layer)).rgb;
          vec3 tHi = texture(tBark, vec3(fract(bUv * 2.15), layer)).rgb;
          t = mix(t, min(t, tHi), bNear * 0.65);
          diffuseColor.rgb *= mix(1.0, 0.42 + 0.78 * t.r, k * 0.9);
          // (Close up, darker down in the cracks.)
          diffuseColor.rgb *= 1.0 - ${Je(Uo.cracks)} * bNear * (1.0 - smoothstep(0.15, 0.6, t.r));
          bLean = vec2(t.g * 2.0 - 1.0, 1.0 - t.b * 2.0) * k * (1.0 + ${Je(Uo.lean)} * bNear);
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
        }`)},e.customProgramCacheKey=()=>"bark-v4-ultra",e}var Dh=.12,Fi={top:.2,under:.32},dr={span:2.6,between:.6,bright:1.1,fade:[70,130],average:[.243,.445,.119]};function $x(e,n,t=!1){n&&(e.alphaToCoverage=!0);let r=n?Wl():null;return e.onBeforeCompile=o=>{r&&(o.uniforms.tLeaves={value:r}),o.vertexShader=o.vertexShader.replace("#include <common>",`#include <common>
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
        float tCut = ${Je(Fi.top)} + ${Je(Fi.under-Fi.top)} * tUnder;
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
        totalEmissiveRadiance += diffuseColor.rgb * ${Je(Dh)} * tUnder${t?" * (1.0 - vBark.a)":""};`)},e.customProgramCacheKey=()=>`leafy-crown-v6-${n?"g":"s"}${t?"b":""}`,zn(e,"crown"),rn(e,"crown",{gaps:n?Fi:null,bark:t,glow:Dh,leaves:r?{map:r,cols:at.cols,rows:at.rows,...dr}:null})}var op=e=>Math.min(1,Math.max(0,(e-Ko[0])/(Ko[1]-Ko[0]))),Uh=op(1),$i={across:.82,up:.92},Kx=.68,$l=e=>gn[e]?.under??Kx;function Kl(e,n=1,t=1){if(!e)return{r:0,y:0};if(!e.userData.reach){let i=e.attributes.position,a=0,s=0;for(let l=0;l<i.count;l++)a=Math.max(a,Math.hypot(i.getX(l),i.getZ(l))),s=Math.max(s,Math.abs(i.getY(l)));e.userData.reach={r:a,y:s}}let{r,y:o}=e.userData.reach;return{r:r*n,y:o*t}}function ip(e){if(!e)return null;if(!e.userData.hull){let n=e.attributes.position,t=[];for(let r=0;r<n.count;r++)t.push([n.getX(r),n.getZ(r)]);e.userData.hull=Float32Array.from(Ic(t).flat())}return e.userData.hull}var Yx=.14,qx=.035,gn={pine:{bark:"bark",texture:"pine",tex:"plates"},leaf:{bark:"bark",texture:"leaf",cards:24,size:1.22,boughs:!0,ends:{near:5,close:8,droop:.4,under:-.7,radius:[.5,.7]}},birch:{bark:"barkBirch",texture:"birch",cards:46,closeCards:30,size:1.18,drawn:{cards:30,size:1.18},trunk:"birch",tex:"birch"},willow:{bark:"barkWillow",texture:"willowleaf",cards:24,size:1.13,under:.85,ends:{near:3,close:5,droop:.5,up:.1}},poplar:{bark:"barkPoplar",texture:"poplar",cards:36,closeCards:27,size:1.3,drawn:{cards:27,size:1.22},ends:{near:3,close:5,droop:-.3,up:1.6,radius:[.36,.48]}},bush:{bark:"bark",texture:"bush",cards:21,size:1.22,crownDetail:1},scots:{bark:"barkScots",texture:"scots",trunk:"scots",tex:"plates"},oak:{bark:"barkOak",texture:"oak",cards:21,size:1.35,ends:{near:3.5,close:6,droop:.22,up:.55}},column:{bark:"bark",texture:"pine",tex:"plates"},spruce:{bark:"bark",texture:"spruce",tex:"plates"},snag:{bark:"barkSnag",texture:null},beech:{bark:"barkBeech",texture:"beech",trunk:"smooth",cards:44,closeCards:26,size:1.36,drawn:{cards:26,size:1.2},under:.82,tex:"plane",ends:{near:4.5,close:7,droop:.12,up:1.3,radius:[.46,.62]}},chestnut:{bark:"barkChestnut",texture:"chestnut",cards:22,size:1.42,under:.58,ends:{near:6,close:8,droop:.34,picture:"chestnutwhorl"}},cedar:{bark:"barkCedar",texture:"cedar",tex:"plates"},holly:{bark:"barkHolly",texture:"holly",cards:24,size:1,under:.85,tex:"plane",ends:{near:3.5,close:6,droop:.2,up:.3}},hawthorn:{bark:"barkHawthorn",texture:"hawthorn",cards:34,closeCards:20,size:1.15,drawn:{cards:20,size:1},under:.8,ends:{near:6,close:9,droop:.4,up:.3,under:-.9}}},Yl=e=>Tc.has(ht[e]),Ih=0,Nh=1,ap=new Set([3,5,7]),gr=null,_r=null,Oh=null,Ol=()=>({kinds:dt,shapes:dt.map((e,n)=>bc(n)),high:Pe,extra:wt,ultra:At,phone:Ot,leafScale:mn,atlas:[at.cols,at.rows,at.kinds.length],blossomCells:Xl,candles:na,haws:Yn,pictures:Object.keys(fr),ends:[Co,dt.map(e=>gn[e].ends??null)],crowns:dt.map(e=>gn[e].crownDetail??null),crownLeaves:1,...Go?{fine:ea.more}:{}});function G2(){return Oh??=Th(ft,io(["tree shapes",Ol()])).then(e=>_r=e).catch(()=>null),Oh}var Zx=e=>Object.fromEntries(Object.entries(e).map(([n,t])=>[n,t?{geometry:Li(t),atlas:t.userData.atlas??null,...t.userData.blossomCell!=null?{blossomCell:t.userData.blossomCell}:{},...t.userData.cardCorners!=null?{cardCorners:t.userData.cardCorners}:{},...t.userData.leafEnds?{leafEnds:t.userData.leafEnds}:{}}:null]));function jx(e){return Object.fromEntries(Object.entries(e).map(([n,t])=>{if(!t)return[n,null];let r=wl(t.geometry);return t.atlas&&(r.userData.atlas=t.atlas),t.blossomCell!=null&&(r.userData.blossomCell=t.blossomCell),t.cardCorners!=null&&(r.userData.cardCorners=t.cardCorners),t.leafEnds&&(r.userData.leafEnds=Uint32Array.from(t.leafEnds)),[n,r]}))}var Qx=0;function sp(e,n){let t=_r?.find(e,Ol());if(t&&++Qx===2&&!_r.changed&&(_r=null),t)return t.map(o=>o.map(jx));let r=n();return _r?.keep(e,Ol(),r.map(o=>o.map(Zx))),r}function k2(){let e=_r;_r=null,e?.changed&&wh(e)}function ql(){return gr??=sp("tree shapes",lp),gr}function lp(){let e=Jx();if(wt)for(let n of e)for(let t of n)t?.cardsClose&&sl(t.cardsClose);return e}function Zl(e,n,t,r){let o=wc(e,n);return t[o]??He(r+e*997+n*31)}function Jx(){let e=He(334494),n=He(334495),t=He(334496),r=ro(),o=dt.map((i,a)=>r[i].map((s,l)=>{let f=Zl(a,l,[e,n,t],334512),c=gn[i],u=wt?He(790622+dt.indexOf(i)*997+l*31):null;if(Yl(i)){let w=Dn[c.tex]??0,y=Yr(s.trunk,c.trunk,c.tex),P=Pe?pE(s,w):null,D=s.tiers.map(([$,,j,Z,ge])=>[Z,j,ge,$]),U={trunk:P?Ve([y,P]):y,crown:mr(Ll(s.tiers,f),c.texture),cards:Pe?yl(i,a,l,an(qr(s.tiers,f,{under:1}),D),s.tiers,{under:1},1):null};if(wt&&oo.has(a)&&(U.cardsHeart=yl(i,a,l,an(qr($o(s.tiers,a),Yi(a,l),{under:1,every:1/Ki(a)}),D),s.tiers,{under:1},2)),!u)return U;let L=Yr(s.trunk,c.trunk,c.tex,!0);U.trunkNear=P?Ve([L,P]):L;let H=uE(),z=oo.has(a),F=z?$o(s.tiers,a):s.tiers,X=z?H.every/(Oo.coreCardsOf[a]??Oo.coreCards):H.every;return{...U,limbs:Hh(U.trunk,hE({...s,tiers:F},u,w)),cardsClose:yl(i,a,l,an(qr(F,u,{...H,every:X,deep:Kn.deep,under:1}),D),s.tiers,{...H,every:X*1.3,deep:Kn.deep,under:1},3)}}if(s.snag)return{trunk:Yr(s.trunk,null,"furrowed",!1,!0),crown:null,cards:null,limbs:u?mE(s.trunk,u,Dn.furrowed??0):null};let d=i==="willow"?s.spheres.slice(0,s.spheres.length-s.curtain):s.spheres,h=i==="leaf"&&ap.has(l)?["plane","plane"]:[c.trunk,c.tex],_=i==="birch"?Nl:ki,T=i==="birch",p=u?cp(s.trunk,d,u,Dn[h[1]]??0,T?.85:null,He(32284+dt.indexOf(i)*997+l*31),{plain:!T,limbs:!T}):null,m=wt&&jn.has(a)?Yi(a,l):null,v=Pe&&c.ends?{...Co,...c.ends}:null,x=w=>v?an(Rh(d,He(13313+a*997+l*31),Math.round(w*d.length),v),d):null,g=(w,y)=>{let P=c.boughs?nE(s.trunk,d,Dn[h[1]]??0,y):null;return P?Ve([w,P]):w},M=T?rE(s.trunk,d,h):g(Yr(s.trunk,...h),!1),b=p?.geometry&&!T?g(Yr(s.trunk,...h,!0),!0):null,A=(w,y)=>vE(w,w?x(y):null,Wt(i,l),v?.picture??Wt(i,l));Pe&&c.drawn&&_(d,c.drawn.cards,c.drawn.size,f,c.fill||0);let S=c.drawn?He(7855+a*997+l*31):f;return _E({trunk:M,trunkNear:b,crown:mr(Wi(d,f,!0,Pe?c.crownDetail??Ih:2,Pe?$i:null,Pe?Nh:2),Wt(i,l)),cards:Pe?an(_(d,c.cards,c.size,S,c.fill||0),d):null,limbs:b?Hh(M,p.geometry):p?.geometry??null,cardsClose:u?an(oE(zi(a,d),_,Vi(Math.round((c.closeCards??c.cards)*(At?4.2:2.4)*(jn.has(a)?qi(a).cards:1))),jl(c.size*(At?.48:.64)*(jn.has(a)?qi(a).size:1)),u,c.fill||0,p.tips),d):null,core:(u||m)&&jn.has(a)&&!T&&Qn[yn(a)].core<1?mr(Wi(zi(a,d),u??m,!0,Pe?c.crownDetail??Ih:2,Pe?$i:null,Pe?Nh:2),Wt(i,l)):null,cardsHeart:m?an(_(zi(a,d),Math.max(3,Math.round(c.cards*Ki(a))),c.size*Fl(a),m,c.fill||0),d):null,strands:i==="willow"?EE(s,f):null,blossom:Pe?s.flowering?Bl(ki(xE(s.spheres).map(([w,y,P,D])=>[w,y,P,D*1.12]),22,.65,f),0):a===ht.chestnut?gE(d,He(13258014+l*31)):a===ht.hawthorn?Bl(ki(d.map(([w,y,P,D])=>[w,y,P,D*1.1]),Yn.cards,Yn.size,He(18997+l*31)),0):null:null},A,v??Co)}));return o.forEach((i,a)=>i.forEach((s,l)=>[s.cards,s.cardsClose,s.cardsHeart].forEach(f=>Io(f,Wt(dt[a],l))))),o}var eE=1,Ki=e=>(oo.has(e)?Oo.coreCardsOf[e]??Oo.coreCards:qi(e).cards)*eE,Yi=(e,n)=>He(322087+e*997+n*31),Fl=e=>Qn[yn(e)].core<1?qi(e).size:1,Fh={rings:2,sides:4},Un={tip:3,fork:2,small:1.4,out:[.72,.9],leaves:.35},tE={most:4,below:[2.4,4.2],thick:.5,tip:.32,into:.85,least:.3};function nE(e,n,t,r=!1,o=tE){if(!n.length)return null;let i=Math.min(...n.map(([,d,,h])=>d-h*.8)),a=n.filter(([d,h,_,T])=>Math.hypot(d,_)>T*.45&&h-T<i+2.5).map(d=>({l:d,a:Math.atan2(d[2],d[0])})).sort((d,h)=>d.a-h.a);if(!a.length)return null;let s=Math.min(o.most,a.length),l=Array.from({length:s},(d,h)=>a[Math.floor(h*a.length/s)].l),[f,c]=r?hr.branch:[5,5],u=l.map(([d,h,_,T],p)=>{let m=Math.max(i*o.least,i-o.below[0]-(o.below[1]-o.below[0])*(p*.618%1)),v=Math.min(.95,m/e.height),x=Rn(e,v),g=[d,h-T*o.into,_],M=[x[0]+(g[0]-x[0])*.35,x[1]+(g[1]-x[1])*.7,x[2]+(g[2]-x[2])*.35],b=S=>[0,1,2].map(w=>(1-S)*(1-S)*x[w]+2*S*(1-S)*M[w]+S*S*g[w]),A=Tr(e,v)*o.thick;return Et(b,S=>A*(1-(1-o.tip)*S),f,c,null,t,{under:S=>Ji(.45+.55*S)})});return Ve(u)}function Hh(e,n){let t=Ve([e,n]);return t.userData.trunk=(e.index?e.index.count:e.attributes.position.count)/3,t}function rE(e,n,t){let r=cp(e,n,null,Dn[t[1]]??0,.85,null,{plain:!0}).geometry,o=Yr(e,...t);return r?Ve([o,r]):o}function cp(e,n,t,r,o,i,{plain:a=!1,limbs:s=!0}={}){let c=[],u=[],d=o==null?null:()=>o,h=(_,T,p,m,v,x,g)=>{let[M,b,A,S]=n[T];for(let w=0;w<v;w++){let y=p+(v>1?(w/(v-1)-.5)*2*m:0)+(i()-.5)*.6,P=x[0]+i()*(x[1]-x[0]),D=S*(Un.out[0]+i()*(Un.out[1]-Un.out[0])),U=Math.sqrt(1-P*P)*D,L=[M+Math.cos(y)*U,b+P*D,A+Math.sin(y)*U];c.push(Et(Zr(_,L),H=>Math.max(.008,g*(1-.7*H)),1,3,d,r)),u.push([...L,T])}};for(let[_,[T,p,m,v]]of n.entries()){let x=yc(e,[T*1,p*1,m*1]);if(!x)continue;let{at:g,end:M,r0:b}=x;if(a){c.push(Et(g,F=>Math.max(.025,b*(1-.75*F)),Fh.rings,Fh.sides,d,r));continue}s&&c.push(Et(g,F=>Math.max(.025,b*(1-.75*F)),3,5,d,r));let A=g(.65),S=t()*Math.PI*2,w=[M[0]+Math.cos(S)*v*1*.6,M[1]+v*1*(.2+t()*.4),M[2]+Math.sin(S)*v*1*.6];c.push(Et(F=>[0,1,2].map(X=>A[X]+(w[X]-A[X])*F),F=>Math.max(.015,b*.4*(1-.7*F)),2,4,d,r));let y=g(.35),P=S+Math.PI*(.7+t()*.6),D=[M[0]+Math.cos(P)*v*1*.75,M[1]-v*1*(.15+t()*.25),M[2]+Math.sin(P)*v*1*.75],U=F=>[0,1,2].map(X=>y[X]+(D[X]-y[X])*F+(X===1?Math.sin(F*Math.PI)*v*.25:0));c.push(Et(U,F=>Math.max(.015,b*.5*(1-.7*F)),3,4,d,r));let L=v*1<Un.small?1:0,H=Math.max(.012,b*.22);h(M,_,i()*Math.PI*2,Math.PI*(1-1/Un.tip),Un.tip-L,[.35,.85],H),h((F=>[0,1,2].map(X=>A[X]+(w[X]-A[X])*F))(.55+i()*.3),_,S,.7,Un.fork-L,[0,.5],H*.8),h(U(.55+i()*.3),_,P,.7,Un.fork-L,[-.45,.1],H*.8)}return{geometry:c.length?Ve(c):null,tips:u}}function oE(e,n,t,r,o,i,a){let s=[];return e.forEach((l,f)=>{let c=a.filter(h=>h[3]===f),u=Array.isArray(t)?t[f]:t,d=c.length?Math.max(1,Math.round(u*Un.leaves/c.length)):0;s.push(n([l],u-d*c.length,r,o,i)),d&&s.push(iE(l,c,d,r,o))}),Ve(s)}function iE(e,n,t,r,o){let[i,a,s,l]=e,f=[];for(let[c,u,d]of n)for(let h=0;h<t;h++){let _=r*l*(.7+o()*.45),T=new te(c+(o()-.5)*_*1.4,u+(o()-.5)*_,d+(o()-.5)*_*1.4),m=T.clone().sub(new te(i,a,s)).normalize().clone().add(new te(o()-.5,o()-.5,o()-.5).multiplyScalar(.9)).normalize(),v=new Lt(_,_),x=new Kt().setFromUnitVectors(new te(0,0,1),m);x.multiply(new Kt().setFromAxisAngle(new te(0,0,1),o()*Math.PI*2)),v.applyQuaternion(x),v.translate(T.x,T.y,T.z);let g=v.attributes.position,M=v.attributes.normal;for(let b=0;b<g.count;b++){let A=new te(g.getX(b)-i,g.getY(b)-a,g.getZ(b)-s).normalize();M.setXYZ(b,A.x,A.y,A.z)}f.push(v)}return sn(Ve(f),f.length,o,{low:3,high:8.5})}var ea={more:1.6},Go=wt&&!!Pn(Gt("effects",{}),ft).fineleaves,Vi=e=>Go?Math.max(1,Math.round(e*ea.more)):e,jl=e=>Go?e/Math.sqrt(ea.more):e,An={cards:{ultra:{end:18,side:12,inner:8,size:.8},high:{end:11,side:7,inner:5,size:1}},out:.5,inner:.8,under:.86,coreCards:.6,coreSize:1.15,birch:{cards:{ultra:{end:25,side:17,inner:12,size:.46},high:{end:20,side:14,inner:10,size:.62}},coreCards:.55,coreSize:1.1},poplar:{cards:{ultra:{end:14,side:9,inner:7,size:.62},high:{end:9,side:6,inner:4,size:.78}},coreCards:.6,coreSize:1.15,style:"upright"},bush:{cards:{ultra:{end:7,side:5,inner:4,size:.36},high:{end:5,side:3,inner:3,size:.46}},coreCards:.7,coreSize:1.05,style:"shell"},willow:{cards:{ultra:{end:5,side:4,inner:3,size:.62},high:{end:4,side:3,inner:2,size:.78}},coreCards:.65,coreSize:1.1,style:"curtain"},small:{cards:{ultra:{end:12,side:8,inner:6,size:.5},high:{end:8,side:5,inner:4,size:.62}},coreCards:.62,coreSize:1.12}},Oo={cards:{ultra:{end:7,side:4,inner:4,size:1.15},high:{end:4,side:3,inner:3,size:1.4}},coreCards:.7,coreCardsOf:{[ht.scots]:.8,[ht.column]:.95}},ta=e=>e==="conifer"?Oo:An[e]??An,aE=(e="broad")=>{let n=ta(e).cards[At?"ultra":"high"];return Go?{...n,end:Vi(n.end),side:Vi(n.side),inner:Vi(n.inner),size:jl(n.size)}:n},qi=e=>{let n=ta(yn(e));return{cards:n.coreCards,size:n.coreSize}},Hi={};function Hl(e="broad"){if(Hi[e])return Hi[e];let n=ca(e),t=aE(e),r=Qn[e].radius,o=e==="birch",i=e==="conifer",a=e==="snag",s=Dn[o?"birch":i?"plates":"furrowed"]??0,l=n.map(c=>{let[u,d,h]=c.branch,_=m=>[0,1,2].map(v=>(1-m)*(1-m)*u[v]+2*m*(1-m)*d[v]+m*m*h[v]),T=o?()=>.85:null,p=[Et(_,m=>r.base+(r.tip-r.base)*m,3,o||a?3:4,T,s)];for(let[m,v]of c.twigs)p.push(Et(Zr(m,v),x=>r.twig+(r.twigTip-r.twig)*x,1,3,T,s));return Ve(p)}),f=a?{}:up(e,t,fp[e]??65372);for(let c of Object.values(f))for(let u of c)sl(u);return Hi[e]={bark:l,leaves:f},Hi[e]}var fp={birch:728924,conifer:790364,poplar:40796,bush:745308,willow:16220,small:5922652};function up(e,n,t){let r=new Set;for(let a of Ar)if(yn(a)===e)for(let s=0;s<ro()[dt[a]].length;s++)r.add(Wt(dt[a],s));let o=e==="birch"?"cloud":ta(e).style??"shell",i=ca(e).map((a,s)=>e==="conifer"?fE(a,n,He(t+s*131)):o==="curtain"?cE(a,n,He(t+s*131)):lE(a,n,He(t+s*131),o));return Object.fromEntries([...r].map(a=>[a,i.map(s=>Io(Object.assign(s.clone(),{userData:{}}),a))]))}var Ql=(e,n,t)=>e.counts?e.counts[n]??0:n===0?e.end:n===t-1?e.inner:e.side,sE={mid:{counts:[3,2,2,1],grow:1.2,spread:[.15,.65],bush:{counts:[2,1,1,1],grow:1},willow:{counts:[2,1,1,0]},conifer:{counts:[2,1,1,1],grow:1}},far:{counts:[1,1,0,0],grow:1.25,spread:[0,.35],willow:{counts:[1,1,0,0],grow:1.2},conifer:{counts:[1,1,0,0],grow:1.1}}},Bi={};function Zi(e,n="mid"){let t=`${e}:${n}`;if(Bi[t])return Bi[t];let r=sE[n],o=r[e]??{},i=ta(e).cards.high,a=o.grow??r.grow,s={counts:o.counts??r.counts,spread:o.spread??r.spread,size:i.size*a};return Bi[t]={leaves:e==="snag"?{}:up(e,s,((fp[e]??65372)^(n==="far"?4002:1053))>>>0)},Bi[t]}function lE(e,n,t,r="shell"){let o=r==="cloud",i=r==="upright",a=new te(...e.branch[0]),s=[],l=[],f=new te,c=new te,u=new te;e.clumps.forEach(([p,m,v,x],g)=>{let M=Ql(n,g,e.clumps.length);f.set(p,m,v),u.copy(f).sub(a).normalize();for(let b=0;b<M;b++){let A=(b+.5)/M,S=Math.acos(1-2*A)+(t()-.5)*.4,w=b*2.39996+t()*.7,y=new te(Math.sin(S)*Math.cos(w),Math.cos(S),Math.sin(S)*Math.sin(w)),P=n.size*(.8+t()*.5),D=new Lt(P,o?P*(.8+t()*.3):P),U=new Kt().setFromUnitVectors(new te(0,0,1),y);U.multiply(new Kt().setFromAxisAngle(new te(0,0,1),t()*Math.PI*2)),D.applyQuaternion(U);let L=y.clone().multiplyScalar(x*(n.spread?n.spread[0]+(n.spread[1]-n.spread[0])*(o?Math.sqrt(t()):t()):o?.15+.85*Math.sqrt(t()):.3+t()*.7)).add(f);o&&(L.y=m+(L.y-m)*1.8),i&&(L.y=m+(L.y-m)*1.5),D.translate(L.x,L.y,L.z);let H=D.attributes.position,z=D.attributes.normal;for(let F=0;F<H.count;F++)o?c.set(H.getX(F)-p,(H.getY(F)-m)*.5+.45*x,H.getZ(F)-v).normalize().lerp(u,An.out*.6).normalize():c.set(H.getX(F)-p,H.getY(F)-m,H.getZ(F)-v).normalize().lerp(u,An.out).normalize(),z.setXYZ(F,c.x,c.y,c.z);s.push(D),l.push(g)}});let d=sn(Ve(s),s.length,t,{low:3,high:8.5}),h=d.attributes.position,_=d.attributes.color,T=h.count/s.length;for(let p=0;p<h.count;p++){let[m,v,x]=e.clumps[l[Math.floor(p/T)]];f.set(m,v,x),u.copy(f).sub(a).normalize(),c.set(h.getX(p)-m,h.getY(p)-v,h.getZ(p)-x).normalize();let g=(An.inner+(1-An.inner)*(.5+.5*c.dot(u)))*(An.under+(1-An.under)*(.5+.5*c.y));_.setXYZ(p,_.getX(p)*g,_.getY(p)*g,_.getZ(p)*g)}return d}function cE(e,n,t){let r=new te(...e.branch[0]),o=[];return e.clumps.forEach(([i,a,s,l],f)=>{let c=Ql(n,f,e.clumps.length),u=Math.atan2(s-r.z,i-r.x);for(let d=0;d<c;d++){let h=u+(d-(c-1)/2)*.45+(t()-.5)*.3,_=i+Math.cos(h)*l*(.3+t()*.5),T=s+Math.sin(h)*l*(.3+t()*.5),p=n.size*(.85+t()*.3),m=p*1.15,v=2+Math.floor(t()*2),x=a+l*(.4+t()*.4);for(let g=0;g<v;g++){let M=new Lt(p*(1-g*.12),m);M.translate(0,x-m/2,0),M.rotateY(-h+Math.PI/2);let b=l*.12*g;M.translate(_+Math.cos(h)*b,0,T+Math.sin(h)*b);let A=M.attributes.normal;for(let S=0;S<A.count;S++){let w=new te(Math.cos(h),.25,Math.sin(h)).normalize();A.setXYZ(S,w.x,w.y,w.z)}o.push(M),x-=m*.82}}}),sn(Ve(o),o.length,t,{low:.4,high:7})}function fE(e,n,t){let r=new te(...e.branch[0]),o=[],i=new te,a=new te;e.clumps.forEach(([u,d,h,_],T)=>{let p=Ql(n,T,e.clumps.length);i.set(u-r.x,0,h-r.z).normalize();let m=Math.atan2(i.z,i.x);for(let v=0;v<p;v++){let x=n.size*(.8+t()*.4),g=new Lt(x,x*.8);g.rotateX(-Math.PI/2+.45+t()*.25),g.translate(0,0,x*.2),g.rotateY(-(m+(t()-.5)*1.1)+Math.PI/2);let M=t()*Math.PI*2,b=_*(n.spread?n.spread[0]+(n.spread[1]-n.spread[0])*Math.sqrt(t()):Math.sqrt(t()));g.translate(u+Math.cos(M)*b,d+(t()-.6)*_*.5,h+Math.sin(M)*b);let A=g.attributes.position,S=g.attributes.normal;for(let w=0;w<A.count;w++)a.set(A.getX(w)-r.x,0,A.getZ(w)-r.z).normalize(),a.y=.6,a.normalize(),S.setXYZ(w,a.x,a.y,a.z);o.push(g)}});let s=sn(Ve(o),o.length,t,{low:1,high:10}),l=s.attributes.position,f=s.attributes.color,c=Math.max(.001,...e.clumps.map(([u,,d])=>Math.hypot(u-r.x,d-r.z)));for(let u=0;u<l.count;u++){let d=Math.min(1,Math.hypot(l.getX(u)-r.x,l.getZ(u)-r.z)/c),h=An.inner+(1-An.inner)*d;f.setXYZ(u,f.getX(u)*h,f.getY(u)*h,f.getZ(u)*h)}return s}function zi(e,n){return jn.has(e)?n.map(([t,r,o,i])=>[t,r,o,i*Qn[yn(e)].core]):n}var Cl=new Map;function dp(e,n,t,r,o){let i=yn(e.kind),a=Qn[i],s=ro()[n][e.shape],l={close:[],near:[],far:[]};if(i==="snag"){let v=Hl(i).bark;for(let x of Lc(s,e.seed))l.near.push({role:"trunk",geometry:v[x.kit],matrix:e.matrix.clone().multiply(new Yt().fromArray(x.matrix)),color:t.color,key:t.key});return l}let f=s.tiers?s.tiers.map(([v,,x,g,M])=>[g,x,M,v]):Rc(s),c=`${e.kind}:${e.shape}`;Cl.has(c)||Cl.set(c,hp(f));let u=Cl.get(c),d=Wt(n,e.shape),h=o?Hl(i):null,_=Zi(i,"mid").leaves[d],T=Zi(i,"far").leaves[d],p=new Yt,m=i==="conifer"?Pc({trunk:s.trunk,tiers:s.tiers},e.seed,{kind:e.kind,toward:e.open}):Cc({trunk:s.trunk,dome:f},e.seed,{kind:e.kind,toward:e.open});for(let v of m){let x=e.matrix.clone().multiply(p.fromArray(v.matrix)),[g,M,b]=v.clumps[0],A=pp(u,g,M,b),[S,w,y]=u.tints?mp(u,g,M,b):[1,1,1],P=1+v.shade*a.shade.light,D=v.shade*a.shade.warm,U=r.color.clone();U.setRGB(U.r*A*S*P*(1+D),U.g*A*w*P,U.b*A*1.03*y*P*(1-D)),h&&(l.close.push({role:"limbs",geometry:h.bark[v.kit],matrix:x,color:t.color,key:t.key}),l.close.push({role:"cardsClose",geometry:h.leaves[d][v.kit],matrix:x,color:U,key:r.key})),l.near.push({role:"cards",geometry:_[v.kit],matrix:x,color:U,key:r.key}),l.far.push({role:"far",geometry:T[v.kit],matrix:x,color:U,key:r.key})}return l}var Kn={arms:[5,9],reach:[.72,.88],cards:{ultra:{every:1/3,grow:.6},high:{every:1/2,grow:.72}},deep:[.3,.78]},uE=()=>{let e=Kn.cards[At?"ultra":"high"];return Go?{...e,every:e.every/ea.more,grow:jl(e.grow)}:e};function dE(e){let n=[0];for(let r=1;r<e.length;r++)n.push(n[r-1]+Math.hypot(e[r][0]-e[r-1][0],e[r][1]-e[r-1][1],e[r][2]-e[r-1][2]));let t=n.at(-1)||1;return r=>{let o=Math.min(1,Math.max(0,r))*t,i=1;for(;i<e.length-1&&n[i]<o;)i++;let a=(o-n[i-1])/(n[i]-n[i-1]||1);return[0,1,2].map(s=>e[i-1][s]+(e[i][s]-e[i-1][s])*a)}}var Zr=(e,n)=>t=>[0,1,2].map(r=>e[r]+(n[r]-e[r])*t);function hE(e,n,t){let{trunk:r,tiers:o}=e,i=[],a=Rn(r,1);for(let[s,l,f,c,u]of o){let d=f-l*.3,h=d<=a[1]?Rn(r,Math.max(0,d/r.height)):[c,d,u],_=Math.round(Math.min(Kn.arms[1],Math.max(Kn.arms[0],s*2.4))),T=n()*Math.PI*2,p=Math.min(.09,.03+s*.018);for(let m=0;m<_;m++){let v=T+m/_*Math.PI*2+(n()-.5)*.5,x=s*(Kn.reach[0]+n()*(Kn.reach[1]-Kn.reach[0])),g=[c+Math.cos(v)*x,d-l*(.1+n()*.1),u+Math.sin(v)*x],M=[h[0]+(g[0]-h[0])*.45,Math.max(h[1],g[1])+l*.08,h[2]+(g[2]-h[2])*.45],b=A=>[0,1,2].map(S=>(1-A)*(1-A)*h[S]+2*A*(1-A)*M[S]+A*A*g[S]);if(i.push(Et(b,A=>Math.max(.012,p*(1-.8*A)),2,3,null,t)),n()<.7){let A=b(.5),S=v+(n()<.5?-1:1)*(.5+n()*.4),w=x*.35;i.push(Et(Zr(A,[A[0]+Math.cos(S)*w,A[1]-l*.06,A[2]+Math.sin(S)*w]),y=>Math.max(.01,p*.45*(1-.7*y)),1,3,null,t))}}}return Ve(i)}function pE(e,n){let{trunk:t,tiers:r}=e,o=Rn(t,1),i=r.reduce((f,c)=>c[2]+c[1]*.5>f[2]+f[1]*.5?c:f),a=[o,...[...r].sort((f,c)=>f[2]-c[2]).filter(f=>f[2]>o[1]+.3).map(([,,f,c,u])=>[c,f,u])],s=i[2]+i[1]*.2;if(s>a.at(-1)[1]+.3&&a.push([i[3],s,i[4]]),a.length<2)return null;let l=Tr(t,1);return Et(dE(a),f=>Math.max(.02,l*(1-.85*f)),Math.max(2,(a.length-1)*2),6,null,n)}function mE(e,n,t){let r=[];for(let s of e.branches){let l=n()<.6?2:1;for(let f=0;f<l;f++){let c=.55+n()*.3,u=br(e,s,c),d=s.b+(n()-.5)*1.6,h=s.len*(.18+n()*.12),_=[u[0]+Math.cos(d)*h*.6,u[1]+h*(.6+n()*.35),u[2]+Math.sin(d)*h*.6],T=wr(s,c)*.55;r.push(Et(Zr(u,_),p=>Math.max(.012,T*(1-.75*p)),2,4,null,t))}}let o=3+Math.floor(n()*3);for(let s=0;s<o;s++){let l=.15+n()*.6,f=Rn(e,l),c=n()*Math.PI*2,u=Tr(e,l),d=u+.15+n()*.3;r.push(Et(Zr(f,[f[0]+Math.cos(c)*d,f[1]+d*(.2+n()*.4),f[2]+Math.sin(c)*d]),h=>u*.35*(1-.5*h),2,5,null,t))}let i=Rn(e,1),a=3+Math.floor(n()*3);for(let s=0;s<a;s++){let l=s/a*Math.PI*2+n()*.6,f=[i[0]+Math.cos(l)*e.r1*.6,i[1]-.15,i[2]+Math.sin(l)*e.r1*.6],c=.2+n()*.3;r.push(Et(Zr(f,[f[0]+Math.cos(l)*.06,f[1]+c,f[2]+Math.sin(l)*.06]),u=>Math.max(.006,e.r1*.35*(1-u)),2,3,null,t))}return Ve(r)}var vr={heart:.62,under:.72,round:.5,patch:.09};function hp(e){let n=0,t=0,r=0;for(let[l,f,c]of e)n+=l/e.length,t+=f/e.length,r+=c/e.length;let o=0,i=1/0,a=-1/0;for(let[l,f,c,u]of e)o=Math.max(o,Math.hypot(l-n,f-t,c-r)+u),i=Math.min(i,f-u),a=Math.max(a,f+u);let s=vr.patch&&e.length>1?e.map(([l,f,c])=>{let d=(Math.abs(Math.sin(l*12.9898+f*78.233+c*37.719)*43758.5453)%1*2-1)*vr.patch;return[1+d*1.2,1+d*.5,1-d*1.4]}):null;return{cx:n,cy:t,cz:r,reach:o,lo:i,hi:a,tints:s,dome:e}}function pp(e,n,t,r){let o=Math.min(1,Math.hypot(n-e.cx,t-e.cy,r-e.cz)/(e.reach||1)),i=Math.min(1,Math.max(0,(t-e.lo)/(e.hi-e.lo||1)));return(vr.heart+(1-vr.heart)*o**1.5)*(vr.under+(1.08-vr.under)*i)}function mp(e,n,t,r){let o=0,i=1/0;for(let a=0;a<e.dome.length;a++){let[s,l,f,c]=e.dome[a],u=Math.hypot(n-s,t-l,r-f)/(c||1);u<i&&(i=u,o=a)}return e.tints[o]}function an(e,n){if(!e||!n.length)return e;let t=hp(n),r=e.attributes.position,o=e.attributes.color;for(let a=0;a<r.count;a++){let s=pp(t,r.getX(a),r.getY(a),r.getZ(a));o.setXYZ(a,Math.min(1,o.getX(a)*s),Math.min(1,o.getY(a)*s),Math.min(1,o.getZ(a)*s*1.03))}if(t.tints)for(let a=0;a<r.count;a++){let[s,l,f]=mp(t,r.getX(a),r.getY(a),r.getZ(a));o.setXYZ(a,Math.min(1,o.getX(a)*s),Math.min(1,o.getY(a)*l),Math.min(1,o.getZ(a)*f))}let i=e.attributes.normal;if(i){let a=new te,s=new te;for(let l=0;l<r.count;l++)s.set(r.getX(l)-t.cx,r.getY(l)-t.cy,r.getZ(l)-t.cz).normalize(),a.set(i.getX(l),i.getY(l),i.getZ(l)).lerp(s,vr.round).normalize(),i.setXYZ(l,a.x,a.y,a.z)}return e}function Bl(e,n,t=128*mn){if(!e||e.userData.blossomCell!=null)return e;let r=e.attributes.uv,o=.5/t;for(let i=0;i<r.count;i++)r.setX(i,(n+o+r.getX(i)*(1-2*o))/Xl);return r.needsUpdate=!0,e.userData.blossomCell=n,e}var na={most:24,apart:1.25,from:.12,out:1.07,height:1.12,width:.62,sunk:.12,lean:.22,share:.8,pink:.14,lit:.55,low:.74};function gE(e,n){let t=na,r=[];for(let[s,l,f,c]of e){let u=Math.max(6,Math.round(c*c*3.2));for(let d=0;d<u;d++){let h=t.from+(1-t.from)*((d+n())/u),_=d*2.39996+n()*.8,T=Math.sqrt(Math.max(0,1-h*h)),p=[T*Math.cos(_),h,T*Math.sin(_)],m=[s+p[0]*c*t.out,l+p[1]*c*t.out,f+p[2]*c*t.out];e.some(([v,x,g,M])=>(v!==s||x!==l||g!==f)&&Math.hypot(m[0]-v,m[1]-x,m[2]-g)<M*1.04)||r.push({at:m,dir:p,pick:n()})}}r.sort((s,l)=>s.pick-l.pick);let o=[];for(let s of r){if(o.length>=t.most)break;o.every(l=>Math.hypot(l.at[0]-s.at[0],l.at[1]-s.at[1],l.at[2]-s.at[2])>=t.apart)&&o.push(s)}if(!o.length)return null;let i=new te(0,1,0),a=[];for(let{at:s,dir:l}of o){let f=.85+n()*.35,c=n()*Math.PI,u=new te(l[0],0,l[2]),d=u.lengthSq()>1e-6?new te().crossVectors(i,u.normalize()):new te(1,0,0),h=new Kt().setFromAxisAngle(d.normalize(),t.lean*(1-l[1])),_=new te(l[0]*t.lit,1,l[2]*t.lit).normalize(),T=(.9+n()*.1)*(t.low+(1-t.low)*l[1]);for(let p of[0,Math.PI/2]){let m=new Lt(t.width*f,t.height*f);m.translate(0,t.height*f*.5-t.sunk,0),m.rotateY(c+p),m.applyQuaternion(h),m.translate(s[0],s[1],s[2]);let v=m.attributes.normal;for(let x=0;x<v.count;x++)v.setXYZ(x,_.x,_.y,_.z);m.setAttribute("color",new Oe(new Float32Array(v.count*3).fill(T),3)),a.push(m)}}return Bl(Ve(a),1)}function _E(e,n,t){return e.cards&&(e.cards=n(e.cards,t.near)),e.cardsHeart&&(e.cardsHeart=n(e.cardsHeart,t.near)),e.cardsClose&&(e.cardsClose=n(e.cardsClose,t.close)),e}function vE(e,n,t,r){if(!e||!n)return e;Io(e,t),Io(n,r);let o=Ve([e,n]);return o.userData.atlas=t,o.userData.cardCorners=e.attributes.position.count,o}var Yn={cards:5,size:.36,may:.9,pink:.12,haws:.55,autumn:.85,dull:.5};function SE(e,n,t){if(e===ht.chestnut){let r=He(n^13258014);return{color:gp(r),on:(t==="summer"||t==="spring")&&r()<na.share}}if(e===ht.hawthorn){let r=He(n^18997),o=new ye;return t==="spring"?(r()<Yn.pink?o.setHSL(.94+r()*.03,.5,.82):o.setHSL(.14,.2+r()*.15,.93),{color:o,on:r()<Yn.may}):(o.setHSL((.985+r()*.03)%1,.62+r()*.12,(.36+r()*.07)*Yn.dull),{color:o,on:r()<(t==="autumn"?Yn.autumn:Yn.haws)})}return null}function gp(e,n=new ye){return e()<na.pink?n.setHSL(.955+e()*.03,.5+e()*.15,.7+e()*.06):n.setHSL(.13+e()*.03,.3+e()*.2,.9+e()*.04)}function xE(e){let n=e.reduce((t,r)=>t+r[1],0)/e.length;return e.filter(t=>t[1]>=n-.05)}function EE(e,n){let t=[],r=e.spheres.slice(0,e.spheres.length-e.curtain);for(let[o,i,a,s]of r){let l=Math.atan2(a,o),f=7;for(let c=0;c<f;c++){let u=l+(c-(f-1)/2)*.24+(n()-.5)*.2,d=o+Math.cos(u)*s*(.5+n()*.28),h=a+Math.sin(u)*s*(.5+n()*.28),_=i+s*(.2+n()*.35),T=_-(.4+n()*.45),p=n()<.4?T*(.28+n()*.3):T,m=_-p;if(p<1.2)continue;let v=.95+n()*.5,x=new Lt(v,p,1,5),g=x.attributes.position,M=s*(.18+n()*.3);for(let w=0;w<g.count;w++){let y=g.getY(w)/p+.5;g.setX(w,g.getX(w)*(.82+.35*y)),g.setZ(w,Math.sin((1-y)*Math.PI*.55)*M)}x.translate(0,(_+m)/2,0),x.rotateY(-u+Math.PI/2),x.translate(d,0,h);let b=x.attributes.uv,A=Math.max(2,p/.9);for(let w=0;w<b.count;w++)b.setY(w,b.getY(w)*A);let S=x.attributes.normal;for(let w=0;w<g.count;w++){let y=new te(g.getX(w),.25,g.getZ(w)).normalize();S.setXYZ(w,y.x,y.y,y.z)}t.push(x)}}return t.length?sn(Ve(t),t.length,n,{low:.4,high:7}):null}var Ct={cardShare:.25,cardGrow:1.9,birchGrow:1.8,pineEvery:3,pineGrow:1.5,sides:6,rings:3};function ME(e,n,t,r=ht[e],o=0){let i=gn[e],a=Dn[i.tex??"furrowed"]??0,s=e==="birch"||e==="beech"?rp:Ji,l=(S,w,y,P=1.05,D=s)=>Et(U=>Rn(S,U),U=>Tr(S,U)*P,w,y,null,a,{under:D});if(n.snag){let S=n.trunk.branches.map(w=>Et(y=>br(n.trunk,w,y),y=>wr(w,y)*1.2,1,4,null,a));return{trunk:Ve([l(n.trunk,Ct.rings,Ct.sides,1.1,null),...S]),crown:null,cards:null}}let f=n.trunk.branches.filter(S=>S.stem).map(S=>Et(w=>br(n.trunk,S,w),w=>wr(S,w)*1.05,Ct.rings,Ct.sides,null,a,{under:s})),c=f.length?Ve([l(n.trunk,Ct.rings,Ct.sides),...f]):l(n.trunk,Ct.rings,Ct.sides);if(Yl(e)){let S=n.tiers.map(([y,,P,D,U])=>[D,P,U,y]),w={trunk:c,crown:mr(Ll(n.tiers,t,Ct.sides,!0),i.texture),cards:Pe?an(qr(n.tiers,t,{every:Ct.pineEvery,grow:Ct.pineGrow}),S):null};if(wt&&oo.has(r)){let y=Yi(r,o),P=$o(n.tiers,r);w.crownHeart=mr(Ll(P,y,Ct.sides,!0),i.texture),w.cardsHeart=an(qr(P,y,{every:Ct.pineEvery/Ki(r),grow:Ct.pineGrow}),S)}return w}let u=i.drawn??i,d=Math.max(3,Math.round((u.cards??12)*Ct.cardShare)),h=e==="willow"?n.curtain??0:0,_=n.spheres.slice(0,n.spheres.length-h),T=n.spheres.slice(n.spheres.length-h),p=(S,w,y=t)=>ki(S,w,u.size*Ct.cardGrow*(y===t?1:Fl(r)),y,i.fill||0),m=Pe?an(e==="birch"?Nl(n.spheres,d+1,u.size*Ct.birchGrow,t):T.length?Ve([p(_,d),p(T,Math.max(2,d>>1))]):p(_,d),_):null,v=e==="birch"&&Pe?null:mr(Wi(n.spheres,t,!0,Pe?0:1,Pe?$i:null),Wt(e,o));if(!wt||!jn.has(r))return{trunk:c,crown:v,cards:m};let x=Yi(r,o),g=zi(r,_),M=Math.max(2,Math.round(d*Ki(r))),b=an(e==="birch"?Nl(g,M+1,u.size*Ct.birchGrow*Fl(r),x):T.length?Ve([p(g,M,x),p(T,Math.max(2,d>>1),x)]):p(g,M,x),_),A=e==="birch"||Qn[yn(r)].core>=1?null:mr(Wi([...g,...T],x,!0,0,$i),Wt(e,o));return{trunk:c,crown:v,cards:m,cardsHeart:b,crownHeart:A}}var jr=null;function Jl(){return jr??=sp("low tree shapes",_p),jr}function _p(){let e=He(4004),n=He(4005),t=He(4006),r=ro(),o=dt.map((i,a)=>r[i].map((s,l)=>ME(i,s,Zl(a,l,[e,n,t],64176),a,l)));return o.forEach((i,a)=>i.forEach((s,l)=>[s.cards,s.cardsHeart].forEach(f=>Io(f,Wt(dt[a],l))))),o}function Bh(e,n,t){let r=[["far",n.trunk,e.matrix,new ye(pt[gn[t].bark]),"bark"]];if(n.cards){n.crown&&r.push(["far",n.crown,e.matrix,e.color.clone().multiplyScalar($l(t)),"crown"]);let o=Wt(t,e.shape);r.push(["far",n.cards,e.matrix,Bo(e.color,o),Jr(o)])}else n.crown&&r.push(["far",n.crown,e.matrix,e.color,"crown"]);return r}var Qr=!0;function V2(e){Qr=!!e}function z2(){return Qr}var[qn,Gl,Gh,kh]=[xi,$s,Yu,qu].map(e=>Ot?Ku(e):e),eo=qn[ft];dn(2,"3D trees to 220 m",e=>eo=e?qn.medium:qn.high,{of:"high"});var vp=()=>!Ot&&!!ju[ft]&&eo===qn[ft];function W2(){return vp()}var ec=new Set;function X2(e){return e&&(ec.add(e),e.visible=!iu(),e)}dn(1.5,"no neighbour trees",e=>{au(e);for(let n of ec)n.visible=!e},{of:"high"});var Sp=!1,ra=!1,tc=()=>!wt||Sp?0:At&&!ra?Gl.ultra:Gl.high,TE=()=>tc()?At&&!ra?Gh.ultra:Gh.high:0,bE=()=>At&&!ra?kh.ultra:kh.high,wE=()=>!Ot&&At&&!!Zu.ultra&&tc()===Gl.ultra;dn(2,"close-up trees to 45 m",e=>ra=e,{of:"ultra"});dn(.75,"no close-up trees",e=>Sp=e,{of:"high"});dn(2,"simpler far trees",e=>{eo=e?qn.standard:qn.medium});dn(2.6,"3D trees only near the shot",e=>{eo=e?qn.least:qn.standard});var nc=.2;function Vh(e,n="cards"){let t=Jr(e)==="leaves"?[at.cols,at.rows]:[1,1];return Yh({map:Ul(e),vertexColors:!0,alphaToCoverage:!0,alphaTest:nc},n,t)}function $2(e,{groundY:n=()=>0,seed:t=11,shadows:r=!0,forms:o=null,farOnly:i=!1,front:a=null,own:s=null,facing:l=null}={}){let f=new hs,c=Pe,u=i?null:ql(),d=i?Jl():null,h=new Kt,_=new Kt,T=new te(0,1,0),p=new te,m=[],v=mh(e),x=e.map((M,b)=>{let A=o?.[b]??Dc(M),[S,w]=M,y=Number.isInteger(A.shape)?A.shape%((i?d:u)[A.kind]?.length??xc):0;h.setFromAxisAngle(T,A.yaw??0),_.setFromAxisAngle(p.set(Math.cos(A.leanA??0),0,Math.sin(A.leanA??0)),A.lean??0);let P=new Yt().compose(new te(S,n(S,w)-.2,w),_.clone().multiply(h),new te(A.w*(A.sx??1),A.h,A.w*(A.sz??1))),D=op(A.thick??1),U=A.seed??fa([S,w]),L=pr(dt[A.kind]??"leaf",He(U^29095)),H=He(U^2317)();if((A.kind===ht.leaf||A.kind===ht.oak)&&H<Fx.share&&(L=pr("accent",He(U^11325015))),wn&&Hx.has(A.kind)){let J=He(U^24229),xe=J();xe<wn.turn?L=pr("autumn",J):xe<wn.turn+wn.brown?L=pr("dead",J):ml(L,"leaves")}let z=L.clone().offsetHSL(qx*(D-Uh),c?0:.1,Yx*(Uh-D)),F=gh(ph(S,w),v[b]);z.offsetHSL(F.hue,F.sat,F.light);let X=SE(A.kind,U,wn?.name??"summer"),$=X?X.color:pr("bush",He(U^11601232),new ye,np),j=!X||X.on,Z=i?null:u[A.kind]?.[y],ge=Z?[Z.crown,Z.cards,Z.cardsHeart,Pe?Z.strands:null,A.kind===ht.chestnut||A.kind===ht.hawthorn?null:Z.blossom,Z.crown?null:Z.trunk]:[],Ee=Z?ge.map(J=>Kl(J)):[{r:.65,y:.9}],ze=!!Z&&!(wt&&Ar.has(A.kind)),$e={r:Math.max(0,...Ee.map(J=>J.r)),y:Math.max(0,...Ee.map(J=>J.y)),...ze?{hull:ge.flatMap(J=>J?[...ip(J)]:[])}:{}},We=Uc(A,$e),q=n(S,w)-.2;return m.push({x:S,z:w,kind:dt[A.kind],width:A.w??1,seed:U}),{kind:A.kind,shape:y,matrix:P,color:z,thick:D,blossom:$,flowers:j,seed:U,open:A.open??null,crown:{x:S,z:w,r:We.r,top:q+We.top},height:We.top}});if(!i&&wt&&Tn.on[ft]&&Qr){let M=Ju(Float32Array.from(x.flatMap(b=>[b.crown.x,b.crown.z,b.height,b.crown.r])),{facing:l});x.forEach((b,A)=>b.buried=M[A]===1)}f.userData.crowns=x.map(M=>M.crown),f.userData.kinds={};for(let M of x)f.userData.kinds[dt[M.kind]]=(f.userData.kinds[dt[M.kind]]??0)+1;let g={leafMat:$x(new En({color:c?10135696:14476752,vertexColors:!0}),c),cardMats:{leaves:Vh("leaf"),willow:Vh("willow","strands"),blossom:Yh({map:tp(),vertexColors:!0,alphaToCoverage:!0,alphaTest:nc})}};for(let M of Object.values(g.cardMats))M.userData.seeThrough="leaves";return c&&(g.leafMat.userData.seeThrough="leaves"),i||Qr?AE(f,x,u,g,r&&!i,i,a,s):UE(f,x,u,g,r),Pe&&!i&&(f.userData.feet=Sh(m,n)),f}function xp(e,n,t){let r=[["trunk",n.trunk,e.matrix,new ye(pt[gn[t].bark]),"bark"]];if(n.cards){t!=="birch"&&!Yl(t)&&r.push(["crown",n.crown,e.matrix,e.color.clone().multiplyScalar($l(t)),"crown"]);let o=Wt(t,e.shape);r.push(["cards",n.cards,e.matrix,Bo(e.color,o),Jr(o)]),Pe&&n.strands&&r.push(["strands",n.strands,e.matrix,e.color.clone().lerp(new ye(1,1,.9),.4),"willow"]),n.blossom&&e.flowers!==!1&&r.push(["blossom",n.blossom,e.matrix,e.blossom,"blossom"])}else n.crown&&r.push(["crown",n.crown,e.matrix,e.color,"crown"]);return r}function AE(e,n,t,r,o,i=!1,a=null,s=null){let l=Jl(),f=new Map,c=n.map(h=>Rp(h,t,l,i)),u=[...new Set(n.map(h=>h.kind))],d=h=>h==="bark"?LE():h==="crown"?r.leafMat:r.cardMats[h];for(let h of c)for(let _ of i?h.far:oc(h)){let T=f.get(_.key);T||f.set(_.key,T={key:_.key,material:d(_.key),geometries:new Map,parts:[]}),T.geometries.has(_.geometry)||T.geometries.set(_.geometry,-1),T.parts.push(_)}for(let h of f.values()){let _=RE(u).get(h.key),T=!!_&&[...h.geometries.keys()].every(v=>_.ids.has(v)),p=T?new Qi(h.parts.length,_,h.material):Ep(h);if(T)for(let v of h.geometries.keys())h.geometries.set(v,_.ids.get(v));p.userData.role=(h.parts.find(v=>v.role!=="far")??h.parts[0]).role;let m=[];for(let v of h.parts){let x=p.addInstance(h.geometries.get(v.geometry));p.setMatrixAt(x,v.matrix),p.setColorAt(x,v.color),p.setVisibleAt(x,i||Ks(v.role,{boughs:!1},v)),v.mesh=p,v.id=x;let g=v.geometry.userData.leafEnds;g&&rc(h.key)&&m.push({id:x,x:v.matrix.elements[12],y:v.matrix.elements[13],z:v.matrix.elements[14],ends:g})}Od(p,m),p.sortObjects=h.key==="crown"&&!Pe,p.castShadow=o&&h.key!=="blossom",h.key==="blossom"&&(p.userData.blossom=!0),h.key==="bark"&&(p.userData.trunk=!0),e.add(p)}i||(e.userData.detail=new Vl(e,n,c,a,s))}var rc=e=>wt&&e!=null&&e!=="bark"&&e!=="crown"&&e!=="willow"&&e!=="blossom";function Ep(e){let n=0,t=0;if(rc(e.key))for(let o of e.geometries.keys())ll(o);for(let o of e.geometries.keys())n+=o.attributes.position.count,t+=o.index?o.index.count:0;let r=new ci(e.parts.length,n,Math.max(1,t),e.material);for(let o of e.geometries.keys())e.geometries.set(o,r.addGeometry(o));return r}var In=null,Fo=new Set,zh=new Set,Mp=new Set,Tp=!1,Ho=new Set,bp=dt.map((e,n)=>n);function K2(e){Tp=!0;for(let t of e)Mp.add(t);if(!In||!Qr)return!1;let n=kl(e);return ji(),n}function RE(e=bp){return In?e.some(n=>!Fo.has(n))&&(kl(e),ji()):(In=new Map,kl([...Mp,...e]),ji()),In}function kl(e){let n=[...new Set(e)].filter(r=>dt[r]!=null&&!Fo.has(r));if(!n.length)return!1;wp(n);let t=wt?[...new Set(n.filter(r=>Ar.has(r)).map(yn))].filter(r=>!zh.has(r)):[];for(let[r,o]of yE(n,t)){let i=In.get(r),a=[...o].filter(s=>!i?.ids.has(s));if(a.length)try{if(i)CE(i,a,r);else{let s={key:r,geometries:new Map(a.map(l=>[l,-1])),parts:[null]};In.set(r,{store:Ep(s),ids:s.geometries})}}catch(s){console.warn(`Trees: the ${r} shapes kept in each batch (${s.message})`)}}for(let r of n)Fo.add(r);for(let r of t)zh.add(r);return!0}function yE(e,n){let t=ql(),r=Jl(),o=new Map,i=(a,s)=>{o.has(a)||o.set(a,new Set),o.get(a).add(s)};for(let a of e)t[a].forEach((s,l)=>{for(let f of[!1,!0]){let c={kind:a,shape:l,matrix:new Yt,color:new ye,thick:1,blossom:new ye,seed:1,buried:f};for(let u of oc(Rp(c,t,r,!1)))i(u.key,u.geometry)}});for(let a of n)for(let s of[Hl(a),Zi(a,"mid"),Zi(a,"far")]){if(s.bark)for(let l of s.bark)i("bark",l);for(let[l,f]of Object.entries(s.leaves))for(let c of f)i(Jr(l),c)}return o}function CE(e,n,t=null){let r=e.store,o=0,i=0;if(rc(t))for(let a of n)ll(a);for(let a of n)o+=a.attributes.position.count,i+=a.index?a.index.count:0;r.setGeometrySize(r._maxVertexCount+o,r._maxIndexCount+i);for(let a of n)e.ids.set(a,r.addGeometry(a))}function wp(e){let n=e.filter(i=>Ho.has(i));if(!n.length)return;let t=lp(),r=_p(),o=(i,a)=>i.forEach((s,l)=>{for(let[f,c]of Object.entries(s)){let u=a[l]?.[f];if(!(!c||!u)){for(let[d,h]of Object.entries(u.attributes))c.setAttribute(d,h);u.index&&c.setIndex(u.index),c.userData.gone=!1,c.userData.idle=!1}}});for(let i of n)o(gr[i],t[i]),jr&&o(jr[i],r[i]),Ho.delete(i)}var Ap=!1;function Y2(){Ap=!0,ji()}function ji(){if(!Ap||!In||!Qr||!gr)return;for(let n of gr)for(let t of n)for(let r of[t.crown,t.cards,t.cardsHeart,t.strands,t.blossom,t.trunk])r&&(Kl(r),wt||ip(r));let e=n=>{for(let[t,r]of Object.entries(n.attributes))n.setAttribute(t,new Oe(new r.array.constructor(0),r.itemSize,r.normalized));n.index&&n.setIndex(new Oe(new n.index.array.constructor(0),1))};for(let{ids:n}of In.values())for(let t of n.keys())t.userData.onShelf||(t.userData.onShelf=!0,e(t));for(let n of Fo)for(let t of[...gr[n],...jr?.[n]??[]])for(let r of Object.values(t))!r||r.userData.onShelf||r.userData.idle||(r.userData.idle=!0,e(r));if(Tp){for(let n of bp)if(!(Fo.has(n)||Ho.has(n))){for(let t of[...gr[n],...jr?.[n]??[]])for(let r of Object.values(t))!r||r.userData.onShelf||r.userData.gone||r.userData.idle||(r.userData.gone=!0,e(r));Ho.add(n)}}}function q2(){wp([...Ho]);for(let{store:e,ids:n}of In?.values()??[]){let t=e.geometry;for(let[r,o]of n){if(!r.userData.onShelf)continue;let i=e.getGeometryRangeAt(o);for(let[a,s]of Object.entries(t.attributes))r.setAttribute(a,new Oe(s.array.slice(i.vertexStart*s.itemSize,(i.vertexStart+i.vertexCount)*s.itemSize),s.itemSize,s.normalized));t.index&&r.setIndex(new Oe(t.index.array.slice(i.indexStart,i.indexStart+i.indexCount).map(a=>a-i.vertexStart),1)),r.userData.onShelf=!1}}}var PE=["geometry","_geometryInfo","_geometryCount","_nextVertexStart","_nextIndexStart"],Qi=class extends ci{constructor(n,t,r){let o=t.store;super(n,o._maxVertexCount,o._maxIndexCount,r),this.shelf=t,this._geometryInitialized=!0}dispose(){this.shelf=null,this._own.geometry=new xt,super.dispose()}};for(let e of PE)Object.defineProperty(Qi.prototype,e,{get(){return this.shelf?this.shelf.store[e]:this._own?.[e]},set(n){this._own||Object.defineProperty(this,"_own",{value:{},writable:!0}),this.shelf||(this._own[e]=n)}});function Rp(e,n,t,r){let o=dt[e.kind],i=r?null:n[e.kind][e.shape],a=t[e.kind][e.shape],s=wt&&e.seed!=null&&Ar.has(e.kind),l=i?xp(e,i,o).map(([v,x,g,M,b])=>({role:v,geometry:x,matrix:g,color:M,key:b})):[],f=l.find(v=>v.role==="cards"),c=l.find(v=>v.role==="trunk"),u=l.find(v=>v.role==="crown"),d=s&&!!e.buried&&!!i;if(d){u&&Object.assign(u,{worn:!0,geometry:i.core??u.geometry}),f&&i.cardsHeart&&Object.assign(f,{worn:!0,geometry:i.cardsHeart});for(let v of l)v.role==="strands"&&(v.worn=!0);for(let[v,x,g,M,b]of Bh(e,a,o).slice(1))l.push({role:v==="far"?b==="crown"?"crown":"cards":v,geometry:x,matrix:g,color:M,key:b,plain:!0})}else s?(u&&i.core&&(u.geometry=i.core),f&&i.cardsHeart&&(f.geometry=i.cardsHeart)):u&&i?.core&&(u.nearOnly=!0);let h=Wt(o,e.shape),_=s?dp(e,o,{color:c?.color??new ye(pt[gn[o].bark]),key:"bark"},{color:f?.color??Bo(e.color,h),key:Jr(h)},!r&&!!i.limbs&&(f?!!i.cardsClose:!0)):null;i&&l.push(...(_?.near??[]).map(v=>d?{...v,worn:!0}:v));let T=!r&&i.limbs&&i.trunkNear&&c,p=!r&&i.limbs?[{...c,role:"limbs",geometry:i.limbs},...i.cardsClose&&f?[{...f,role:"cardsClose",geometry:i.cardsClose}]:[],...!s&&u&&i.core?[{...u,role:"core",geometry:i.core,nearOnly:!1}]:[],..._?.close??[]]:null;T&&Object.assign(c,{geometry:i.trunkNear,nearOnly:!0});let m=Bh(e,s&&!d?{...a,crown:a.crownHeart??a.crown,cards:a.cardsHeart??a.cards}:a,o).map(([v,x,g,M,b])=>({role:v,geometry:x,matrix:g,color:M,key:b}));return a.cards&&!d&&m.push(..._?.far??[]),{near:l,close:p,far:m}}function oc(e){return e.close?[...e.near,...e.close,...e.far]:[...e.near,...e.far]}function LE(){return yp(new En({color:16777215,vertexColors:!0}))}function yp(e){e.userData.seeThrough="trunk";let n=zn(Xx(e),"trunk");return Pe?rn(n,"bark",{tBark:Ao().tBark}):n}var Wh={leaf:"#87b261",pine:"#7dba6f",oak:"#87b261",birch:"#a4c878",poplar:"#7eaa58",bush:"#8fb868",willowleaf:"#9cb86a",willow:"#9cb86a",plane:"#87b261",chestnut:"#87b261",chestnutwhorl:"#87b261",holly:"#87b261",hawthorn:"#87b261",beech:"#87b261",spruce:"#7dba6f",scots:"#7dba6f",cedar:"#7dba6f"};var DE=new ye(1,1,.95),Gi={h:0,s:0,l:0};function Bo(e,n="leaf",t=new ye){let r=new ye(Wh[n]??Wh.leaf);e.clone().lerp(DE,.45).multiply(r).getHSL(Gi);let{s:i,l:a}=Gi;return e.getHSL(Gi),t.setHSL(Gi.h,i,a),t.setRGB(t.r/r.r,t.g/r.g,t.b/r.b)}function Z2(){let e=ql(),n=He(684453),t=He(684454),r=He(684455),o=new ye(Pe?10135696:14476752),i=new Yt;return dt.map((a,s)=>e[s].map((l,f)=>{let c=Zl(s,f,[n,t,r],684464),u=pr(a,c),d=Pe?u:u.clone().offsetHSL(0,.1,0),h=pr("bush",c,new ye,np);s===ht.chestnut&&gp(He(13258014+f*31+7),h);let _=[{role:"trunk",geometry:l.trunk,matrix:i,color:new ye(pt[gn[a].bark]),map:null}],T=wt&&Ar.has(s),p=Wt(a,f),m=T?dp({kind:s,shape:f,matrix:i,seed:fa([s,f,176])},a,{color:_[0].color,key:"bark"},{color:Bo(d,p),key:Jr(p)},!1).near:[];return _.push(...m.filter(v=>v.role==="trunk").map(v=>({role:"trunk",geometry:v.geometry,matrix:v.matrix,color:v.color,map:null}))),l.cards?(a!=="birch"&&_.push({role:"crown",geometry:T&&l.core||l.crown,matrix:i,color:d.clone().multiplyScalar($l(a)).multiply(o),map:null}),_.push({role:"cards",geometry:T&&l.cardsHeart||l.cards,matrix:i,color:Bo(d,p),map:Ul(p)}),_.push(...m.filter(v=>v.role==="cards").map(v=>({role:"cards",geometry:v.geometry,matrix:v.matrix,color:v.color,map:Ul(p)}))),l.strands&&_.push({role:"strands",geometry:l.strands,matrix:i,color:d.clone().lerp(new ye(1,1,.9),.4),map:Jh("willow")}),l.blossom&&s!==ht.hawthorn&&_.push({role:"blossom",geometry:l.blossom,matrix:i,color:h,map:tp()})):l.crown&&_.push({role:"crown",geometry:l.crown,matrix:i,color:d.clone().multiply(o),map:null}),_}))}function UE(e,n,t,r,o){let i=new Map,a=l=>{let f=gn[l].bark;return i.has(f)||i.set(f,yp(new En({color:pt[f],vertexColors:!0}))),i.get(f)},s={crown:r.leafMat,...r.cardMats};for(let l=0;l<dt.length;l++){let f=dt[l];for(let c=0;c<t[l].length;c++)for(let u of[!0,!1]){let d=n.filter(T=>T.kind===l&&T.shape===c&&T.flowers!==!1===u);if(!d.length)continue;let h=t[l][c],_=d.map(T=>xp(T,h,f));_[0].forEach(([T,p,,,m],v)=>{let x=new ms(p,T==="trunk"?a(f):s[m],d.length);x.userData.role=T,x.userData.kind=f,_.forEach((g,M)=>{let[,,b,A]=g[v];x.setMatrixAt(M,b),T!=="trunk"&&x.setColorAt(M,A)}),T==="trunk"&&(x.userData.trunk=!0),T==="blossom"&&(x.userData.blossom=!0),x.castShadow=o&&T!=="blossom",e.add(x)})}}}var ic=new Set;function j2(e){ec.delete(e);let n=e.userData?.detail;n&&ic.delete(n)}var Vl=class{constructor(n,t,r,o=null,i=null){this.group=n,this.front=o,this.own=i,this.placed=t,this.trees=r,this.centres=new Float32Array(t.length*2),t.forEach((a,s)=>{this.centres[s*2]=a.crown.x,this.centres[s*2+1]=a.crown.z}),this.far=new Uint8Array(t.length),this.close=new Uint8Array(t.length),this.hasClose=r.some(a=>a.close),this.buried=Uint8Array.from(t,a=>a.buried?1:0),this.boughs=new Uint8Array(t.length),this.hasBuried=this.buried.some(a=>a),this.plan=null,this.decided=!1,ic.add(this)}decide(n,t,r=!0,o=n,i=null){let a=this.own&&wE()?this.own:null,s=new Set(nd(this.centres,Ys(n,t),this.far,{distance:vp()?1/0:eo,never:a}));if(this.hasClose&&r)for(let f of Qu(this.centres,o,this.close,{distance:tc(),front:this.front,frontDistance:TE(),max:bE(),always:a,ahead:i?{dir:i}:null}))s.add(f);if(this.hasBuried&&r)for(let f of ed(this.centres,Ys(n,t),this.buried,this.boughs))s.add(f);let l=new Set;for(let f of s){let c=this.trees[f],u={far:this.far[f]===1,close:!!c.close&&this.close[f]===1,boughs:this.boughs[f]===1};for(let d of oc(c))d.mesh.setVisibleAt(d.id,Ks(d.role,u,d)),l.add(d.mesh)}for(let f of l)f.userData.shadowVersion=(f.userData.shadowVersion??0)+1;return this.decided=!0,s.size}};function Q2(e,n,{cut:t=!1,plan:r=null,stand:o=null}={}){Nd(n);let i=0,a=[n.position.x,n.position.z],s=n.quaternion,l=s?[-2*(s.x*s.z+s.w*s.y),-(1-2*(s.x*s.x+s.y*s.y))]:null,f=l&&Math.hypot(l[0],l[1])>.5?l:null;for(let c of ic){let u=c.group;for(;u.parent;)u=u.parent;if(!u.isScene||u!==e)continue;let d=r!==c.plan;c.plan=r;let h=rd(c.centres,c.far,a[0],a[1],{distance:eo});od({cut:t||!c.decided,newPlan:d,tooClose:h})&&(i+=c.decide(a,r,t||!c.decided||d,o??a,f))}return i}var oa={factor:1.5,maxPixels:3840*2160,least:1.1},ac={full:4,light:2,superAt:1.4};function r3({supersample:e=1,taa:n=!1}={}){return n&&e>=ac.superAt?ac.light:ac.full}function IE({width:e,height:n,ratio:t=1}={}){let r=Number(e),o=Number(n),i=Number.isFinite(t)&&t>0?t:1;if(!(r>0&&o>0))return 1;let a=r*o*i*i,s=Math.sqrt(oa.maxPixels/a),l=Math.min(oa.factor,s);return l>=oa.least?Math.floor(l*100)/100:1}function o3({width:e,height:n,ratio:t=1,rec:r=null}={}){let o=IE({width:e,height:n,ratio:t}),i=Number.isFinite(t)&&t>0?t:1,a=Number(e)*i,s=Number(n)*i;if(!(r?.width>0&&r?.height>0)||!(a>0&&s>0))return 1;let l=Math.min(r.width/a,r.height/s),f=Math.min(o,l);return f>=oa.least?Math.floor(f*100)/100:1}var NE={factor:1,hold:.3};function i3(e,{moving:n=!1,recording:t=!1,dt:r=0}={}){return t?(e.eased=!1,e.left=0):n?(e.eased=!0,e.left=NE.hold):e.eased&&(e.left-=Number.isFinite(r)?r:0,e.left<=0&&(e.eased=!1)),e.eased}function a3(e,n=1,t=1){let r=Number.isFinite(e)&&e>0?e:1,o=Number.isFinite(n)&&n>0?Math.min(n,1):1,i=Number.isFinite(t)&&t>=1?t:1;return Math.round(r*o*i*1e3)/1e3}var sc={most:2,join:.3,scale:.5,keep:{move:3,turn:.06}};function s3(e,n,t=sc.keep){return e<t.move&&n<t.turn}function l3(e,{most:n=sc.most,join:t=sc.join}={}){let r=[],o=e.map((i,a)=>({...i,i:a})).filter(i=>Number.isFinite(i.level)).sort((i,a)=>(i.near??1/0)-(a.near??1/0));for(let i of o){let a=r.find(s=>Math.abs(s.level-i.level)<=t);a?a.members.push(i.i):r.length<n&&r.push({level:i.level,members:[i.i]})}return r}var ko={near:.45,nearSoft:.3,far:6,reach:160,farSoft:2,amount:.55};function c3(e){if(!(e>0))return null;let n=Math.max(e*ko.far,ko.reach);return{near:[e*ko.near,e*ko.nearSoft],far:[n,n*ko.farSoft]}}var OE={strength:.08,decay:.95,samples:40,reach:.35,fade:.6,floor:1.2,cap:6};function f3({x:e,y:n,ahead:t}){if(!t||!Number.isFinite(e)||!Number.isFinite(n))return 0;let r=Math.max(Math.abs(e),Math.abs(n))-1;if(r<=0)return 1;let o=Math.min(1,r/OE.fade);return 1-o*o*(3-2*o)}var FE={frames:8,blend:.9};function Cp(e,n){let t=1,r=0;for(let o=e+1;o>0;o=Math.floor(o/n))t/=n,r+=t*(o%n);return r}function u3(e,{still:n=!1,upscale:t=!1}={}){if(n&&!t)return[0,0];let r=t?Pp.frames:FE.frames,o=(e%r+r)%r;return[Cp(o,2)-.5,Cp(o,3)-.5]}var Pp={share:.67,frames:16,sharp:2.2,least:.04,most:.3};function d3(e,n,t=!0){let r=t?Pp.share:1;return[Math.max(1,Math.round(e*r)),Math.max(1,Math.round(n*r))]}var Sr={most:4,life:5,speed:.8,rings:3,gap:.55};function h3(e,n){let t=e.filter(o=>n.time-o.time<Sr.life),r=Math.min(1,Math.max(0,Number(n.size)||0));return[...t,{...n,size:r}].slice(-Sr.most)}function p3(e){let n=Number.isFinite(e)?e:0;return Math.min(1,.3+n/40)}var ia=6200,zo=[0,-300],HE=.25,Lp=40,S3={high:{clouds:24,puffs:8},standard:{clouds:12,puffs:5}},Vo={billow:.24,soft:.5,shrink:.3,round:.55},lc=new Set;function BE(e,n,t=1){let r=nu(t*104729+3),o=[],i=[];for(let a=0;a<e;a++){let l=r()<.6?-Math.PI/2+(r()-.5)*2.2:a/e*Math.PI*2+r()*.3,f=2400+r()*2900,c=a%3===2,u=c?1150+r()*350:560+r()*320,d=c?260+r()*260:380+r()*420;o.push({x:Math.cos(l)*f+zo[0],y:u,z:Math.sin(l)*f+zo[1],rank:(a+r()*.8)/e,width:d});for(let h=0;h<n;h++){let _=n===1?0:(h/(n-1)-.5)*2*(.75+r()*.2),T=1-_*_,p=h%2===0,m=d*(.17+.13*T+r()*.06)*(p?.95:.8),v=p?m*.35:m*(.55+T*.7)*(c?.6:1);i.push({cloud:a,x:_*d*.5,y:v,z:(r()-.5)*d*.35,r:m,shade:Math.min(1,v/(d*.42))})}}return{clouds:o,puffs:i}}var Dp=e=>Math.min(1,1.7*Math.max(0,Number.isFinite(e)?e:0)),GE=`
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
`,kE=`
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
    float edge = ${(1-Vo.billow).toFixed(2)} + ${Vo.billow.toFixed(2)} * (0.65 * cNoise(q * 2.6 + vSeed * 40.0) + 0.35 * cNoise(q * 6.1 + vSeed * 73.0));
    float body = 1.0 - r / edge;
    // Thinning out to its edge over CLOUD_LOOK.soft of the way in; and as
    // it fades (out far off, or in and out with the day's cover) thinner as
    // a whole and shrunk a little from its edge (CLOUD_LOOK.shrink). With
    // hard-rimmed puffs a cloud half faded was a ghost of rings, each puff's
    // outline over the next; shrunk away alone, it broke into separate
    // little balls.
    float gone = (1.0 - vAlpha) * ${Vo.shrink.toFixed(2)};
    float a = smoothstep(gone, gone + ${Vo.soft.toFixed(2)}, body) * vAlpha * uOpacity;
    if (a <= 0.003) discard;
    // Lit on the side towards the sun and on top, over the cloud's own
    // shading from base to top - each puff's own roundness held back
    // (CLOUD_LOOK.round), so a cloud is lit as one, not as a heap of balls.
    vec3 n = vec3(q, sqrt(max(0.0, 1.0 - r * r)));
    float towards = dot(n, normalize(vec3(vSun * 0.7, 0.6))) * 0.5 + 0.5;
    float lit = clamp(vShade * 0.55 + (n.y * 0.25 + towards * 0.45 - 0.35) * ${Vo.round.toFixed(2)} + 0.3, 0.0, 1.0);
    gl_FragColor = vec4(mix(uBase, uTop, lit), a);
    #include <colorspace_fragment>
  }
`;function x3({clouds:e=24,puffs:n=8,sun:t=new te(0,1,0),seed:r=1}={}){let o=new Lt(1,1),i=new Ts;i.index=o.index,i.setAttribute("position",o.getAttribute("position"));let a=e*n,s=new Ir(new Float32Array(a*3),3),l=new Ir(new Float32Array(a*4),4),f=new Ir(new Float32Array(a*2),2);for(let d of[s,l,f])d.setUsage(cs);i.setAttribute("aCloud",s),i.setAttribute("aPuff",l),i.setAttribute("aLook",f),i.instanceCount=a;let c=new en({name:"Clouds",vertexShader:GE,fragmentShader:kE,uniforms:{uDrift:{value:new je},uMiddle:{value:new je(...zo)},uWrap:{value:ia},uShowing:{value:Dp(.35)},uSize:{value:1},uReach:{value:1},uSun:{value:t.clone().normalize()},uTop:{value:new ye(pt.cloud)},uBase:{value:new ye(pt.cloudShade)},uOpacity:{value:.95}},transparent:!0,depthWrite:!1,fog:!1,toneMapped:!1});rn(c,"clouds",{uniforms:c.uniforms});let u=new yt(i,c);return u.name="clouds",u.frustumCulled=!1,u.userData.clouds={count:e,perCloud:n,sortedAt:-1/0,at:new te(1/0,0,0),sorts:0},VE(u,r),u.onBeforeRender=(d,h,_)=>zE(u,_),lc.add(u),u}function VE(e,n=1){let t=e.userData.clouds;t.layout=BE(t.count,t.perCloud,n),t.seed=n,t.sortedAt=-1/0}function E3(e,n){let t=e.material.uniforms;t.uShowing.value=Dp(n.cover),t.uSize.value=1+.55*Math.max(0,n.cover-.35),t.uOpacity.value=.9+.08*n.cover,t.uBase.value.set(pt.cloudShade).lerp(new ye(pt.cloudSlate),n.grey*.8)}function zE(e,n){let t=e.userData.clouds,r=performance.now()/1e3,o=n.getWorldPosition(WE);if(r-t.sortedAt<HE&&o.distanceToSquared(t.at)<Lp*Lp)return;t.sortedAt=r,t.at.copy(o),t.sorts++;let i=e.material.uniforms,a=i.uSize.value,[s,l]=[i.uDrift.value.x,i.uDrift.value.y],f=ia,c=(x,g)=>((x-g+f)%(2*f)+2*f)%(2*f)-f+g,{clouds:u,puffs:d}=t.layout,h=u.map(x=>[c(x.x+s,zo[0]),x.y,c(x.z+l,zo[1])]),_=d.map((x,g)=>{let M=h[x.cloud],b=M[0]+x.x*a-o.x,A=M[1]+x.y*a-o.y,S=M[2]+x.z*a-o.z;return[b*b+A*A+S*S,g]});_.sort((x,g)=>g[0]-x[0]);let T=e.geometry,p=T.getAttribute("aCloud").array,m=T.getAttribute("aPuff").array,v=T.getAttribute("aLook").array;_.forEach(([,x],g)=>{let M=d[x],b=u[M.cloud];p.set([b.x,b.y,b.z],g*3),m.set([M.x,M.y,M.z,M.r],g*4),v.set([M.shade,b.rank],g*2)});for(let x of["aCloud","aPuff","aLook"])T.getAttribute(x).needsUpdate=!0}var WE=new te,M3=e=>1/(1+.6*Math.max(0,e-1));function T3(e,[n,t]){for(let r of lc){if(!r.parent){lc.delete(r);continue}let o=r.material.uniforms.uDrift.value;o.x=(o.x+n*e)%(2*ia),o.y=(o.y+t*e)%(2*ia)}}var Up={base:700,top:1350,steps:32,light:3,reach:9e3,fade:.45,noise:32,cells:4,big:700,small:190};function w3(e){let n=Math.min(1,Math.max(0,Number.isFinite(e)?e:.35));return n<.35?.97-(.97-.625)*(n/.35):Math.max(.25,.8-.5*n)}function A3(e=Up.noise,n=Up.cells,t=7){let r=t,o=()=>(r=r*16807%2147483647)/2147483647,i=u=>{let d=Float32Array.from({length:u*u*u},o);return(_,T,p)=>d[(p%u+u)%u*u*u+(T%u+u)%u*u+(_%u+u)%u]},a=i(n),s=i(n*2),l=u=>u*u*(3-2*u),f=(u,d,h,_,T)=>{let p=h/e*d,m=_/e*d,v=T/e*d,x=Math.floor(p),g=Math.floor(m),M=Math.floor(v),b=l(p-x),A=l(m-g),S=l(v-M),w=(P,D,U)=>P+(D-P)*U,y=P=>w(w(u(x,g,P),u(x+1,g,P),b),w(u(x,g+1,P),u(x+1,g+1,P),b),A);return w(y(M),y(M+1),S)},c=new Uint8Array(e*e*e);for(let u=0;u<e;u++)for(let d=0;d<e;d++)for(let h=0;h<e;h++){let _=.65*f(a,n,h,d,u)+.35*f(s,n*2,h,d,u);c[u*e*e+d*e+h]=Math.round(_*255)}return c}function Ip(e,n,t){let r=!1;for(let o=0,i=e.length-1;o<e.length;i=o++){let[a,s]=e[o],[l,f]=e[i];s>t!=f>t&&n<(l-a)*(t-s)/(f-s)+a&&(r=!r)}return r}var Op=2e3;function*y3(e,{cell:n=.25,pad:t=1.5,maxCells:r=160,heightAt:o=null}={},i=Op){let a=1/0,s=1/0,l=-1/0,f=-1/0;for(let[x,g]of e)a=Math.min(a,x),s=Math.min(s,g),l=Math.max(l,x),f=Math.max(f,g);a-=t,s-=t,l+=t,f+=t,n=Math.max(n,(l-a)/(r-1),(f-s)/(r-1));let c=Math.ceil((l-a)/n)+1,u=Math.ceil((f-s)/n)+1,d=new Float32Array(c*u),h=o?new Float32Array(c*u):null,_=e.length,T=Float64Array.from(e,x=>x[0]),p=Float64Array.from(e,x=>x[1]),m=o?Float64Array.from(e,x=>o(x[0],x[1])):null,v=0;for(let x=0;x<u;x++){x&&(v+=c)>=i&&(v=0,yield);let g=s+x*n;for(let M=0;M<c;M++){let b=a+M*n,A=1/0,S=!1,w=0,y=0;for(let D=0,U=_-1;D<_;U=D++){let L=T[U],H=p[U],z=T[D]-L,F=p[D]-H,X=z*z+F*F,$=X>0?((b-L)*z+(g-H)*F)/X:0;$=$<0?0:$>1?1:$;let j=L+z*$-b,Z=H+F*$-g,ge=j*j+Z*Z;if(ge<A&&(A=ge),m){let Ee=Math.sqrt(X)/((ge+.25)*(ge+.25));w+=Ee*(m[U]+(m[D]-m[U])*$),y+=Ee}p[D]>g!=H>g&&b<z*(g-p[D])/F+T[D]&&(S=!S)}A=Math.sqrt(A);let P=x*c+M;d[P]=S?A:-A,h&&(h[P]=S&&y>0?Math.max(0,w/y-o(b,g)):0)}}return{x0:a,z0:s,cell:n,nx:c,nz:u,width:(c-1)*n,height:(u-1)*n,dist:d,depth:h}}function XE(e,n,t=4){let{x0:r,z0:o,cell:i,nx:a,nz:s}=e,l=r+(a-1)*i,f=o+(s-1)*i,c=n.filter(d=>{let h=d.map(T=>T[0]),_=d.map(T=>T[1]);return Math.min(...h)<l+t&&Math.max(...h)>r-t&&Math.min(..._)<f+t&&Math.max(..._)>o-t});if(!c.length)return null;let u=new Float32Array(a*s).fill(1/0);for(let d of c){let h=d.length;for(let _=0;_<s;_++){let T=o+_*i;for(let p=0;p<a;p++){let m=r+p*i,v=1/0,x=!1;for(let b=0,A=h-1;b<h;A=b++){let[S,w]=d[A],y=d[b][0]-S,P=d[b][1]-w,D=y*y+P*P,U=D>0?((m-S)*y+(T-w)*P)/D:0;U=U<0?0:U>1?1:U;let L=S+y*U-m,H=w+P*U-T;v=Math.min(v,L*L+H*H),d[b][1]>T!=w>T&&m<y*(T-d[b][1])/P+d[b][0]&&(x=!x)}let g=x?-Math.sqrt(v):Math.sqrt(v),M=_*a+p;g<u[M]&&(u[M]=g)}}}return u}function*C3(e,{cell:n=.25,pad:t=1.5,maxCells:r=160,heightAt:o=null}={},i=Op){let a=1/0,s=1/0,l=-1/0,f=-1/0;for(let p of e)for(let[m,v]of p)a=Math.min(a,m),s=Math.min(s,v),l=Math.max(l,m),f=Math.max(f,v);a-=t,s-=t,l+=t,f+=t,n=Math.max(n,(l-a)/(r-1),(f-s)/(r-1));let c=Math.ceil((l-a)/n)+1,u=Math.ceil((f-s)/n)+1,d=[];e.forEach((p,m)=>{for(let v=0,x=p.length-1;v<p.length;x=v++){let g=(p[v][0]+p[x][0])/2,M=(p[v][1]+p[x][1])/2;e.some((b,A)=>A!==m&&Ip(b,g,M))||d.push([p[x][0],p[x][1],p[v][0],p[v][1],o?o(p[x][0],p[x][1]):0,o?o(p[v][0],p[v][1]):0])}});let h=new Float32Array(c*u),_=o?new Float32Array(c*u):null,T=0;for(let p=0;p<u;p++){p&&(T+=c)>=i&&(T=0,yield);let m=s+p*n;for(let v=0;v<c;v++){let x=a+v*n,g=1/0,M=0,b=0;for(let[w,y,P,D,U,L]of d){let H=P-w,z=D-y,F=H*H+z*z,X=F>0?((x-w)*H+(m-y)*z)/F:0;X=X<0?0:X>1?1:X;let $=w+H*X-x,j=y+z*X-m,Z=$*$+j*j;if(Z<g&&(g=Z),_){let ge=Math.sqrt(F)/((Z+.25)*(Z+.25));M+=ge*(U+(L-U)*X),b+=ge}}let A=e.some(w=>Ip(w,x,m));g=Math.sqrt(g);let S=p*c+v;h[S]=A?g:-g,_&&(_[S]=A&&b>0?Math.max(0,M/b-o(x,m)):0)}}return{x0:a,z0:s,cell:n,nx:c,nz:u,width:(c-1)*n,height:(u-1)*n,dist:h,depth:_}}function P3(e,n){let t=n?.length?XE(e,n,0):null;if(!t)return e;let{dist:r}=e;for(let o=0;o<r.length;o++)t[o]<0&&-t[o]>r[o]&&(r[o]=-t[o]);return e}function L3(e,n){let{x0:t,z0:r,cell:o,nx:i,nz:a}=e,s=new Float32Array(i*a);for(let l=0;l<a;l++){let f=r+l*o;for(let c=0;c<i;c++){let u=t+c*o,d=1/0;for(let h=1;h<n.length;h++){let[_,T]=n[h-1],p=n[h][0]-_,m=n[h][1]-T,v=p*p+m*m,x=v>0?((u-_)*p+(f-T)*m)/v:0;x=x<0?0:x>1?1:x;let g=_+p*x-u,M=T+m*x-f;d=Math.min(d,g*g+M*M)}s[l*i+c]=Math.sqrt(d)}}return s}function D3(e,n){let{x0:t,z0:r,cell:o,nx:i,nz:a,dist:s}=e,l=new Float32Array(i*a),f=!1;for(let c=0;c<a;c++)for(let u=0;u<i;u++){let d=c*i+u;l[d]=n(t+u*o,r+c*o),l[d]<0&&s[d]>0&&(f=!0)}if(!f)return null;for(let c=0;c<s.length;c++)s[c]=Math.min(s[c],l[c]);return l}var cc=[-2,4],$E=4,Np=4;function U3(e,n=[-2,6],t=2,r=null,o=null,i=null){let{dist:a,depth:s}=e,l=new Uint8Array(a.length*4),f=n[1]-n[0],c=cc[1]-cc[0];for(let u=0;u<a.length;u++)l[u*4]=Math.round(255*Math.max(0,Math.min(1,(a[u]-n[0])/f))),i?l[u*4+1]=Math.round(255*Math.max(0,Math.min(1,(i[u]+Np)/(2*Np)))):l[u*4+1]=s?Math.round(255*Math.max(0,Math.min(1,s[u]/t))):0,l[u*4+2]=r?Math.round(255*Math.max(0,Math.min(1,(r[u]-cc[0])/c))):255,l[u*4+3]=o?Math.round(255*Math.max(0,Math.min(1,o[u]/$E))):255;return l}var KE=256;function YE(e=KE){let n=new Uint8ClampedArray(e*e*4),t=Ac(17),r=[];for(;r.length<18;){let i=Math.round((t()-.5)*36),a=Math.round((t()-.5)*36),s=Math.hypot(i,a);s<3||r.push({kx:i,ky:a,phase:t()*6.28,amp:(4+t()*4)/s})}let o=(i,a)=>r.reduce((s,l)=>s+l.amp*Math.sin((l.kx*i+l.ky*a)/e*6.2832+l.phase),0);for(let i=0;i<e;i++)for(let a=0;a<e;a++){let s=o(a+1,i)-o(a-1,i),l=o(a,i+1)-o(a,i-1),f=Math.hypot(s*.4,l*.4,1),c=(i*e+a)*4;n[c]=-s*.4/f*127+128,n[c+1]=-l*.4/f*127+128,n[c+2]=1/f*127+128,n[c+3]=255}return n}var to=null;function Fp(){if(to!=null)return to;let e=YE();to=0;for(let n=0;n<e.length;n+=4)to=Math.max(to,Math.hypot(e[n]/255*2-1,e[n+1]/255*2-1));return to}function qE(e,n,t){let r=n.y-t;if(!(r>0))return null;let o=1/0,i=1/0,a=-1/0,s=-1/0;for(let l=0;l<8;l++){let f=l&1?e.max.x:e.min.x,c=l&2?e.max.y:e.min.y,u=l&4?e.max.z:e.min.z,d=r/(r+Math.max(0,c-t)),h=n.x+(f-n.x)*d,_=n.z+(u-n.z)*d;h<o&&(o=h),h>a&&(a=h),_<i&&(i=_),_>s&&(s=_)}return{x0:o,z0:i,x1:a,z1:s}}var ZE=(e,n)=>e.x0<=n.x1&&n.x0<=e.x1&&e.z0<=n.z1&&n.z0<=e.z1;function B3(e,n,t,r){if(!e||!Number.isFinite(e.min?.x)||!Number.isFinite(e.max?.x))return!0;let o=qE(e,n,t);return!!o&&r.some(i=>ZE(o,i))}function G3(e,n,t,r){let o=n.y-t;if(!(o>0))return null;let i=(o+Math.max(0,r-t))/o,a=e.x0,s=e.z0,l=e.x1,f=e.z1;for(let c of[e.x0,e.x1])for(let u of[e.z0,e.z1]){let d=n.x+(c-n.x)*i,h=n.z+(u-n.z)*i;a=Math.min(a,d),l=Math.max(l,d),s=Math.min(s,h),f=Math.max(f,h)}return{x0:a,z0:s,x1:l,z1:f}}var jE=64;function k3(e,n,t=jE){let r=Math.floor((e?e.length:n.length/3)/3),o=e?l=>e[l]:l=>l,i=Math.ceil(r/t),a=new Float32Array(i).fill(-1/0),s=new Float32Array(i).fill(1/0);for(let l=0;l<r;l++){let f=Math.floor(l/t);for(let c=0;c<3;c++){let u=n[o(l*3+c)*3+2];u>a[f]&&(a[f]=u),u<s[f]&&(s[f]=u)}}for(let l=1;l<i;l++)a[l]=Math.max(a[l],a[l-1]);for(let l=i-2;l>=0;l--)s[l]=Math.min(s[l],s[l+1]);return{count:r,block:t,top:a,bottom:s}}function V3(e,n,t){let{count:r,block:o,top:i,bottom:a}=e,s=i.length,l=0,f=s;for(;l<f;){let u=l+f>>1;i[u]<n?l=u+1:f=u}let c=l;for(l=0,f=s;l<f;){let u=l+f>>1;a[u]<=t?l=u+1:f=u}return[c*o,Math.min(r,l*o)]}var xr={coarse:.11,fine:.06,gust:1.3,rain:.5,splash:.55,ringFade:.25,mirror:.06},z3=Object.freeze({near:3,reach:40,calm:.9,wind:6}),W3=Object.freeze({tint:.35,clear:.15,poolFrom:.55,poolTo:.8,scale:2,stretch:.5,speed:.35}),QE=1/Math.sqrt(2*Math.E);function X3({chop:e=1,gust:n=0,rain:t=0,splashes:r=[],now:o=0}={},i=Fp()){let a=(xr.coarse+xr.fine)*i*Math.max(0,e)*(1+xr.gust*Math.max(0,n));t>0&&(a+=xr.rain);for(let s of r){let l=o-s.time;if(!(s.size>0)||l<0||l>=Sr.life)continue;let f=(1-l/Sr.life)**2*s.size,c=0;for(let u=0;u<Sr.rings&&l-u*Sr.gap>=0;u++)c+=1-u*xr.ringFade;a+=xr.splash*QE*f*c}return xr.mirror*2*Math.sin(Math.atan(a)/2)}export{Ce as a,mi as b,Cu as c,Ve as d,Tl as e,qR as f,nn as g,Nt as h,T1 as i,Gr as j,b1 as k,w1 as l,Vu as m,A1 as n,qv as o,R1 as p,y1 as q,C1 as r,P1 as s,L1 as t,H1 as u,B1 as v,ft as w,Pe as x,wt as y,At as z,Ot as A,jv as B,G1 as C,k1 as D,ph as E,eS as F,qs as G,dn as H,uS as I,lA as J,cA as K,fA as L,uA as M,rl as N,dA as O,kr as P,Zs as Q,X1 as R,$1 as S,Js as T,K1 as U,Y1 as V,q1 as W,ld as X,Pn as Y,sS as Z,Z1 as _,tl as $,fS as aa,Mi as ba,nA as ca,rA as da,vd as ea,gS as fa,ol as ga,_A as ha,vA as ia,Td as ja,SS as ka,xS as la,ES as ma,wi as na,wS as oa,AS as pa,wA as qa,CA as ra,YA as sa,rn as ta,zn as ua,Ao as va,UA as wa,IA as xa,lR as ya,cR as za,gl as Aa,Wd as Ba,Wr as Ca,IS as Da,GA as Ea,kA as Fa,$d as Ga,Kd as Ha,FS as Ia,Yd as Ja,qd as Ka,VA as La,zA as Ma,sh as Na,pR as Oa,lh as Pa,gR as Qa,uh as Ra,Dt as Sa,Ml as Ta,KS as Ua,GR as Va,kR as Wa,YS as Xa,VR as Ya,zR as Za,WR as _a,dh as $a,Ci as ab,XR as bb,$R as cb,a2 as db,Th as eb,s2 as fb,l2 as gb,wh as hb,c2 as ib,He as jb,$h as kb,Yh as lb,Tx as mb,B2 as nb,ki as ob,G2 as pb,k2 as qb,V2 as rb,z2 as sb,W2 as tb,X2 as ub,nc as vb,$2 as wb,K2 as xb,Y2 as yb,q2 as zb,Z2 as Ab,j2 as Bb,Q2 as Cb,r3 as Db,IE as Eb,o3 as Fb,NE as Gb,i3 as Hb,a3 as Ib,sc as Jb,s3 as Kb,l3 as Lb,ko as Mb,c3 as Nb,OE as Ob,f3 as Pb,FE as Qb,u3 as Rb,Pp as Sb,d3 as Tb,Sr as Ub,h3 as Vb,p3 as Wb,S3 as Xb,Vo as Yb,x3 as Zb,VE as _b,E3 as $b,M3 as ac,T3 as bc,Bv as cc,Gv as dc,kv as ec,Vv as fc,g1 as gc,_1 as hc,v1 as ic,S1 as jc,x1 as kc,E1 as lc,Hu as mc,Up as nc,w3 as oc,A3 as pc,Ip as qc,y3 as rc,XE as sc,C3 as tc,P3 as uc,L3 as vc,D3 as wc,cc as xc,$E as yc,Np as zc,U3 as Ac,KE as Bc,YE as Cc,B3 as Dc,G3 as Ec,jE as Fc,k3 as Gc,V3 as Hc,xr as Ic,z3 as Jc,W3 as Kc,X3 as Lc};
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
