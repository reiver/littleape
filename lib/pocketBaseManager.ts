import PocketBase from "pocketbase";

export class OtpRequestBody {
  otp: string;
  email: String;

  constructor(otp, email) {
    this.otp = otp;
    this.email = email;
  }
}

// Define the data type for the response
interface ApiResponse {
  message: string;
  code: string;
  error: string;
}

export class SignUpData {
  username: string;
  email: string;
  password: string;
  emailVisibility: boolean;
  passwordConfirm: string;
  name: string;
  avatar: File;

  constructor(username: string, email: string, password: string, avatar: File) {
    this.username = username;
    this.email = email;
    this.password = password;
    this.emailVisibility = true;
    this.passwordConfirm = password;
    this.name = username;
    this.avatar = avatar;
  }
}

export class SignInData {
  email: string;
  password: string;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}

export class PocketBaseManager {
  private static instance: PocketBaseManager;
  private pocketBase: PocketBase;
  private url = "http://127.0.0.1:8090";

  private constructor() {
    // Initialize PocketBase with your base URL
    this.pocketBase = new PocketBase("http://127.0.0.1:8090"); //http://127.0.0.1:8090 //https://pb.greatape.stream/
  }

  public static getInstance(): PocketBaseManager {
    if (!PocketBaseManager.instance) {
      PocketBaseManager.instance = new PocketBaseManager();
    }
    return PocketBaseManager.instance;
  }

  public getToken(): string {
    return this.pocketBase.authStore.token;
  }

  public isValid(): boolean {
    return this.pocketBase.authStore.isValid;
  }

  public logout(): void {
    this.pocketBase.authStore.clear();
  }

  public async verifyEmail(email: string): Promise<any> {
    return await this.pocketBase.collection("users").requestVerification(email);
  }

  public async signUp(signUpData: SignUpData): Promise<any> {
    const formattedSignUpData = {
      email: signUpData.email,
      emailVisibility: signUpData.emailVisibility,
      password: signUpData.password,
      passwordConfirm: signUpData.passwordConfirm,
      name: signUpData.name,
      avatar: signUpData.avatar,
    };

    const record = await this.pocketBase.collection("users").create(formattedSignUpData);

    return record;
  }

  public async signIn(signInData: SignInData): Promise<any> {
    const authData = await this.pocketBase
      .collection("users")
      .authWithPassword(signInData.email, signInData.password);
    return authData;
  }

  public fetchUser() {
    var usermodel = this.pocketBase.authStore.model;
    console.log("userModel: ", usermodel);
    return usermodel;
  }

  //custom api
  verifyOtp = async (data: OtpRequestBody): Promise<ApiResponse> => {
    console.log("JSON.stringify(data): ", JSON.stringify(data));
    const response = await fetch(this.url + "/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  };
}
