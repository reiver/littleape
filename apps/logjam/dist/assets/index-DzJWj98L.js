const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/_404-B23vLvD5.js","assets/index-D6Hx7HI9.js","assets/index-yHV8UesJ.css","assets/logo-yadOnvTX.js"])))=>i.map(i=>d[i]);
import{l as d,_ as c,h as u,y as f,u as e}from"./index-D6Hx7HI9.js";import{z as t,u as p,F as x,T as h,B as g,M as y,t as b,a as w}from"./index-DwukE4FF.js";import"./metatagsLogo-BEZyKCXA.js";import"./logo-yadOnvTX.js";d(()=>c(()=>import("./_404-B23vLvD5.js"),__vite__mapDeps([0,1,2,3])));const v=t.object({room:t.string().min(1,"This field is required"),name:t.string().min(1,"This field is required")}),L=({params:{room:s}})=>{var i;const[l,o]=u(!1),r=p({defaultValues:{room:s,name:""},resolver:b(v)});f(()=>{window.addEventListener("message",a=>{var n;((n=a.data)==null?void 0:n.type)==="FROMIFRAME"&&(console.log("TOP Window URL:",a.origin),w.value=a.origin)})},[]);const m=()=>{o(!0)};if(!l)return e("div",{class:"w-full flex justify-center items-center px-4",children:e("div",{class:"w-full flex justify-center items-center max-w-[500px] mx-auto mt-10 border rounded-md border-gray-300",children:e("form",{class:"flex flex-col w-full ",onSubmit:r.handleSubmit(m),children:[e("span",{className:"text-bold-12 text-black block text-center pt-5",children:"Join the meeting"}),e("hr",{className:"my-3"}),e("div",{className:"p-5 flex flex-col gap-3",children:[e("span",{class:"text-bold-12 text-gray-2",children:"Please enter your display name:"}),e(x,{className:"w-full",children:e(h,{label:"Display name",variant:"outlined",size:"small",...r.register("name"),error:!!r.formState.errors.name,helperText:(i=r.formState.errors.name)==null?void 0:i.message})}),e("div",{class:"flex gap-2 w-full",children:e(g,{type:"submit",variant:"contained",className:"w-full normal-case",sx:{textTransform:"none"},color:"primary",children:"Attend Live Show"})})]})]})})});if(l)return e(y,{params:{...r.getValues(),room:s}})};export{L as AudiencePage,L as default};
