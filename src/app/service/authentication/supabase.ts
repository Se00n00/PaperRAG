import { Injectable, signal, WritableSignal } from '@angular/core';
import { createClient } from '@supabase/supabase-js'

@Injectable({
  providedIn: 'root'
})
export class Supabase {
  sessions:any = null
  outhed = signal(false)
  data:WritableSignal<any> = signal(null) 


  supabase = createClient(import.meta.env.NG_APP_SUPABASE_URL, import.meta.env.NG_APP_SUPABASE_ANONKEY);

  constructor(){
    this.load_session()
    this.insert_session()
  }

  async insert_session() {
    const { data: { user } } = await this.supabase.auth.getUser();

    const { data: insert_data, error } = await this.supabase
      .from("chat_sessions")
      .insert({ user_id: user?.id ?? null })
      .select("thread_id")
      .single()

    if (error) {
      console.error(error);
      return;
    }

    const threadId = insert_data.thread_id;

    const { error: msgError } = await this.supabase
      .from("chat_messages")
      .insert({
        thread_id: threadId
      });

    if (msgError) console.error(msgError);
  }

  async getCurrentThread() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from("chat_sessions")
      .select("thread_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error(error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log("No current thread exists");
      return null;
    }

    const threadId = data[0].thread_id; // <-- the actual UUID string
    console.log("THREAD ID:", threadId);
    return threadId;
  }




  async load_session(){
    const {data} = await this.supabase.auth.getSession()
    let session = data.session
    if(!session){
      const { data:anonData, error:anonError } = await this.supabase.auth.signInAnonymously()
      if(anonError){
        console.error("FAILED TO CREATE ANONMOUS USER",anonError)
      }else{
        session = anonData.session
      }
    }
    this.sessions = session
    this.data.set(session);
    console.log(session)

    this.supabase.auth.onAuthStateChange((_event,newsession)=>{
      this.sessions = newsession
      this.data.set(newsession);

      // outhed = true if not anonymous
      if (newsession?.user && !newsession.user.is_anonymous) {
        this.outhed.set(true);
      } else {
        this.outhed.set(false);
      }
    })
  }



  async sign_in_oauth(){
    const {data, error} = await this.supabase.auth.signInWithOAuth({
      provider:'google',
      options: {
        redirectTo: import.meta.env.NG_APP_REDIRECT,
      }
    })

    if(error){
      console.log("GOOGLE SIGN IN FAILED", error)
    }else{
      this.outhed.set(true) 
    }
  }

  
  async sign_out() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    this.data.set(null)
    this.outhed.set(false)

    const { data: anonData, error: anonError } =
      await this.supabase.auth.signInAnonymously();

    if (anonError) {
      console.error("FAILED TO CREATE ANONMOUS USER AFTER SIGNOUT", anonError);
      this.sessions = null;
    } else {
      this.sessions = anonData.session;
    }

    
  }
}
