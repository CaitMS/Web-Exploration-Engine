'use server'
import { create } from 'cypress/types/lodash';
import { LoginRequest, SignUpRequest } from '../models/AuthModels';
import { createClient } from '../utils/supabase/server';


export async function login(req: LoginRequest) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: req.email,
    password: req.password,
  })

  if (error) {
    return {
      code: error.code,
      message: error.message,
    }
  }
  const user = data?.user;
  const userName = user?.user_metadata?.first_name || user?.user_metadata?.name || user?.user_metadata?.name || user?.email || '';

  return { 
    uuid: data?.user?.id,
    emailVerified: data?.user?.email_confirmed_at ? true : false,
    name: userName
  }
}

export async function signUp(req: SignUpRequest) {
  // check if email is already taken
  const supabase = createClient();
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', req.email)
  

  if (usersError) {
    return {
      code: usersError.code,
      message: usersError.message,
    }
  }


  if (users && users.length > 0) {
    return {
      code: 'auth/email-already-in-use',
      message: 'Email already in use',
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email: req.email,
    password: req.password,
    options: {
      data: {
        first_name: req.firstName,
        last_name: req.lastName,
        fullname: `${req.firstName} ${req.lastName}`,
      },
    },
  })

  if (error) {
    return {
      code: error.code,
      message: error.message,
    }
  }

  return { 
    uuid: data?.user?.id,
    emailVerified: data?.user?.email_confirmed_at ? true : false,
  }
}