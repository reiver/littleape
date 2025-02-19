import React from "react";
import BlueSkyIcon from "../../../public/Bluesky.svg";
import FarcasterIcon from "../../../public/Farcaster.svg";
import WalletIcon from "../../../public/Wallet.svg";

const Login = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-left mb-6">Login!</h1>
                <p className="text-gray-500 text-left mb-6">
                    Please enter your info. to continue
                </p>
                <form className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-4 py-2 sm:mb-6 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <p className="text-left text-gray-500">
                        Don’t have an account yet?{" "}
                    </p>
                    <a href="#" className="text-black font-semibold block">
                        Register!
                    </a>
                    <button className="sm:mt-6 w-full bg-yellow-400 hover:bg-yellow-500 text-dark py-2 px-4 rounded-md border border-black">
                        Login
                    </button>
                </form>
                <div className="flex items-center justify-center my-4">
                    <hr className="w-1/3 border-gray-300" />
                    <p className="text-sm text-gray-500 mx-2">Or Continue With</p>
                    <hr className="w-1/3 border-gray-300" />
                </div>

                <div className="flex justify-center space-x-4">
                    <div className="relative group">
                        <button className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                            <WalletIcon />
                        </button>
                        <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-50 text-gray-600 text-sm rounded-full px-4 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Your Wallet
                        </span>
                    </div>
                    <div className="relative group">
                        <button className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                            <FarcasterIcon />
                        </button>
                        <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-50 text-gray-600 text-sm rounded-full px-4 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Farcaster
                        </span>
                    </div>
                    <div className="relative group">
                        <button className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                            <BlueSkyIcon />
                        </button>
                        <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-50 text-gray-600 text-sm rounded-full px-4 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Bluesky
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
