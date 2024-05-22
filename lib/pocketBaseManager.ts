import PocketBase from "pocketbase";

export class SignUpData {
  username: string;
  email: string;
  password: string;
  emailVisibility: boolean;
  passwordConfirm: string;
  name: string;
  avatar:File

  constructor(username: string, email: string, password: string,avatar:File) {
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

  private constructor() {
    // Initialize PocketBase with your base URL
    this.pocketBase = new PocketBase("https://pb.greatape.stream");
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

  public async verifyEmail(email:string):  Promise<any>{
    return await this.pocketBase.collection('users').requestVerification(email);
  }

  public async signUp(signUpData: SignUpData): Promise<any> {
    const formattedSignUpData = {
      email: signUpData.email,
      emailVisibility: signUpData.emailVisibility,
      password: signUpData.password,
      passwordConfirm: signUpData.passwordConfirm,
      name: signUpData.name,
      avatar: signUpData.avatar
    };

    const record = await this.pocketBase.collection("users").create(formattedSignUpData);

    return record;
  }

  public async signIn(signInData: SignInData): Promise<any> {
    const authData = await this.pocketBase.collection("users").authWithPassword(signInData.email, signInData.password);
    return authData;
  }
}
