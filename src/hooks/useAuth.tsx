import { createContext, useContext, useEffect, useState } from "react"
import type { AppUser } from "../types"
import { track } from "../services/api"

type AuthCtx = {
  user: AppUser | null
  login: (email:string,password:string)=>Promise<void>
  signup: (data:any)=>Promise<void>
  logout: ()=>void
  loading:boolean
}

const Ctx = createContext<AuthCtx>(null as any)

const DEMO_USER: AppUser = {
  id:"u1", name:"Adebayo Okafor", email:"ade@collectnaija.demo",
  role:"owner",
  org:{ id:"org1", name:"Al-Hikma Private School", type:"school", country:"NG", currency:"NGN"}
}

export function AuthProvider({children}:{children:React.ReactNode}){
  const [user,setUser]=useState<AppUser|null>(()=>{
    const raw=localStorage.getItem("cn_user")
    if(raw) try{ return JSON.parse(raw)}catch{}
    return null
  })
  const [loading,setLoading]=useState(false)
  useEffect(()=>{ if(user) localStorage.setItem("cn_user", JSON.stringify(user)) },[user])

  const login=async(email:string,_pwd:string)=>{
    setLoading(true); await new Promise(r=>setTimeout(r,600))
    const u={...DEMO_USER, email}
    setUser(u); localStorage.setItem("cn_token","demo.jwt.token"); localStorage.setItem("cn_user",JSON.stringify(u))
    track("login_completed"); setLoading(false)
  }
  const signup=async(data:any)=>{
    setLoading(true); await new Promise(r=>setTimeout(r,700))
    const u={...DEMO_USER, name:data.name||DEMO_USER.name, email:data.email}
    setUser(u); localStorage.setItem("cn_token","demo.jwt.token"); localStorage.setItem("cn_user",JSON.stringify(u))
    track("signup_completed"); setLoading(false)
  }
  const logout=()=>{ localStorage.removeItem("cn_token"); localStorage.removeItem("cn_user"); setUser(null)}
  return <Ctx.Provider value={{user,login,signup,logout,loading}}>{children}</Ctx.Provider>
}
export const useAuth=()=>useContext(Ctx)
