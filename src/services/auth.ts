import axios from "axios";
export type LoginPayload = { username:string; password:string; remember?:boolean };

export async function login(payload: LoginPayload) {
  // Khi gắn BE: bật dòng dưới và bỏ phần mock
  // return (await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, payload, {withCredentials:true})).data;
  await new Promise(r=>setTimeout(r, 700));
  if (payload.username==="admin@qhome" && payload.password==="12345678") return {ok:true};
  const err:any = new Error("Unauthorized");
  err.response = { status:401, data:{ message:"Sai tài khoản hoặc mật khẩu" } };
  throw err;
}
