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

export class EnsData {
  id: String;
  ens: String;
  walletId: String;
  public: Boolean;

  constructor(id: String, ens: String, walletId: String, publicVisibility: Boolean) {
    this.id = id;
    this.ens = ens;
    this.walletId = walletId;
    this.public = publicVisibility;
  }
}

export class WalletData {
  id: String;
  address: String;
  userId: String;
  message: String;
  signature: String;
  isConnected: Boolean;

  constructor(
    id: String,
    address: String,
    userid: String,
    message: String,
    signature: String,
    isConnected: Boolean
  ) {
    this.id = id;
    this.address = address;
    this.userId = userid;
    this.message = message;
    this.signature = signature;
    this.isConnected = isConnected;
  }
}

export class PocketBaseManager {
  private static instance: PocketBaseManager;
  private pocketBase: PocketBase;
  private url = "https://pb.greatape.stream";

  private constructor() {
    // Initialize PocketBase with your base URL
    this.pocketBase = new PocketBase("https://pb.greatape.stream"); //http://127.0.0.1:8090 //https://pb.greatape.stream/
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

  public async getWallet(address): Promise<any> {
    try {
      const wallet = await this.pocketBase
        .collection("wallets")
        .getFirstListItem(`address="${address}"`);

      console.log("Wallet found: ", wallet);
      return wallet;
    } catch (error) {
      console.log("Wallet not found: ", error.data);
      return error.data;
    }
  }

  public async saveWallet(walletData): Promise<any> {
    //check if wallet data already exists or nor

    const wall = await this.getWallet(walletData.address);
    if (wall.code && wall.code == 404) {
      //save wallet
      const record = await this.pocketBase.collection("wallets").create(walletData);
      return record;
    }

    const updateWall = await this.pocketBase.collection("wallets").update(wall.id, walletData);

    return updateWall;
  }

  public async saveEns(ensData): Promise<any> {
    const ens = await this.pocketBase.collection("ens").create(ensData);
    return ens;
  }

  public async updateEnsVisibility(ensName, publicStatus): Promise<any> {
    //fetch ens first
    console.log("Ens name to search: ", ensName);
    const record = await this.pocketBase.collection("ens").getFirstListItem(`ens="${ensName}"`);
    console.log("Ens record found: ", record);

    if (record != null) {
      const updatedEnsData = new EnsData(record.id, record.ens, record.walletId, publicStatus);
      const ens = await this.pocketBase.collection("ens").update(record.id, updatedEnsData);
      return ens;
    }
  }

  public async updateWallet(walletData): Promise<any> {
    const wall = await this.pocketBase.collection("wallets").update(walletData.id, walletData);
    return wall;
  }

  public async updateWalletConnectionStatus(id, status): Promise<any> {
    await this.pocketBase.autoCancellation(false);
    const wall = await this.pocketBase.collection("wallets").update(id, { isConnected: status });
    return wall;
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

  public async fetchUserById(id) {
    try {
      const user = await this.pocketBase.collection("users").getFirstListItem(`id="${id}"`);
      return user;
    } catch (e) {
      return e.data;
    }
  }

  public async fetchMyWallets(userId): Promise<any> {
    try {
      const wallets = await this.pocketBase.collection("wallets").getFullList({
        sort: "-created",
        filter: `userId= '${userId}'`,
      });
      return wallets;
    } catch (error) {
      return error.data;
    }
  }

  public async fetchEnsList(walletId, publicVisibility): Promise<any> {
    try {
      const ens = await this.pocketBase.collection("ens").getFullList({
        sort: "-created",
        filter: `walletId= '${walletId}' && public= ${publicVisibility}`,
      });
      return ens;
    } catch (error) {
      return error.data;
    }
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
