import Navbar from "./Navbar";
import { useState, useEffect } from "react";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../pinata";
import Marketplace from '../Marketplace.json';
import { useLocation } from "react-router";
import { createClient } from '@supabase/supabase-js';
import { ethers } from "ethers";

// Supabase client setup
const supabaseUrl = 'https://njlndbldinkavmsdklby.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qbG5kYmxkaW5rYXZtc2RrbGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM1MzA4NTYsImV4cCI6MjAzOTEwNjg1Nn0.L1xQepHWSdL8AE-Ep3VQPWFrF-Nh0OgBwYpyrderc3E'; // Replace with your Supabase Anon Key
const supabase = createClient(supabaseUrl, supabaseKey);

export default function SellNFT() {
    const [formParams, updateFormParams] = useState({ name: '', description: '', price: '' });
    const [fileURL, setFileURL] = useState(null);
    const [message, updateMessage] = useState('');
    const [currentAccount, setCurrentAccount] = useState(null);
    const location = useLocation();

    // Connect to MetaMask
    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setCurrentAccount(accounts[0]);
                updateMessage("Wallet connected: " + accounts[0]);
            } catch (error) {
                console.error("Error connecting to wallet:", error);
                updateMessage("Failed to connect wallet");
            }
        } else {
            updateMessage("Please install MetaMask!");
        }
    };

    useEffect(() => {
        // Check if the user is already connected to MetaMask
        const checkIfWalletIsConnected = async () => {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length) {
                    setCurrentAccount(accounts[0]);
                    updateMessage("Wallet connected: " + accounts[0]);
                } else {
                    updateMessage("No wallet connected");
                }
            } else {
                updateMessage("Please install MetaMask!");
            }
        };
        checkIfWalletIsConnected();
    }, []);

    async function OnChangeFile(e) {
        const file = e.target.files[0];
        if (!file) {
            updateMessage("No file selected!");
            return;
        }

        try {
            disableButton();
            updateMessage("Uploading image... Please don't click anything!");

            const response = await uploadFileToIPFS(file);
            if (response.success) {
                setFileURL(response.pinataURL);
                updateMessage("Upload successful!");
                console.log("Uploaded image to Pinata: ", response.pinataURL);
            } else {
                updateMessage("Upload failed: " + response.message);
            }
        } catch (error) {
            console.error("Error during file upload:", error);
            updateMessage("Upload error: " + error.message);
        } finally {
            enableButton();
        }
    }

    async function uploadMetadataToIPFS() {
        const { name, description, price } = formParams;
        if (!name || !description || !price || !fileURL) {
            updateMessage("Please fill all the fields!");
            return -1;
        }

        const nftJSON = {
            name,
            description,
            price,
            image: fileURL,
        };

        try {
            const response = await uploadJSONToIPFS(nftJSON);
            if (response.success) {
                console.log("Uploaded JSON to Pinata: ", response);
                return response.pinataURL;
            } else {
                updateMessage("Metadata upload failed: " + response.message);
                return -1;
            }
        } catch (error) {
            console.log("Error uploading JSON metadata:", error);
            updateMessage("Error uploading metadata: " + error.message);
        }
    }

    // Updated function to upload metadata to Supabase with error logging
    async function uploadMetadataToSupabase(metadataURL) {
        const { name, description, price } = formParams;

        const { data, error } = await supabase
            .from('charmachli') // Replace 'nfts' with your table name
            .insert([
                { name, description, price, image_url: metadataURL }
            ]);

        if (error) {
            console.error("Error uploading to Supabase:", error.message); // Log the error message
            updateMessage("Failed to upload metadata to Supabase: " + error.message); // Include the error in the UI message
      npm start  
        
            return false;
        }

        console.log("Uploaded to Supabase:", data);
        return true;
    }

    async function listNFT(e) {
        e.preventDefault();

        // Upload data to IPFS
        try {
            const metadataURL = await uploadMetadataToIPFS();
            if (metadataURL === -1) return;

            // Upload metadata to Supabase
            const supabaseUploadSuccess = await uploadMetadataToSupabase(metadataURL);
            if (!supabaseUploadSuccess) return;

            // Interact with the contract
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            disableButton();
            updateMessage("Uploading NFT (this may take a few minutes)... Please don't click anything!");

            let contract = new ethers.Contract(Marketplace.address, Marketplace.abi, signer);

            const price = ethers.utils.parseUnits(formParams.price, 'ether');
            let listingPrice = await contract.getListPrice();
            listingPrice = listingPrice.toString();

            // Create the NFT
            let transaction = await contract.createToken(metadataURL, price, { value: listingPrice });
            await transaction.wait();

            alert("Successfully listed your NFT!");
            enableButton();
            updateMessage("");
            updateFormParams({ name: '', description: '', price: '' });
            window.location.replace("/");
        } catch (error) {
            alert("Upload error: " + error.message);
            enableButton();
        }
    }

    async function disableButton() {
        const listButton = document.getElementById("list-button");
        listButton.disabled = true;
        listButton.style.backgroundColor = "grey";
        listButton.style.opacity = 0.3;
    }

    async function enableButton() {
        const listButton = document.getElementById("list-button");
        listButton.disabled = false;
        listButton.style.backgroundColor = "#A500FF";
        listButton.style.opacity = 1;
    }

    return (
        <div className="">
            <Navbar />
            <div className="flex flex-col place-items-center mt-10" id="nftForm">
                <button onClick={connectWallet} className="font-bold w-full bg-purple-500 text-white rounded p-2 shadow-lg mb-5">
                    {currentAccount ? "Connected: " + currentAccount.slice(0, 6) + "..." + currentAccount.slice(-4) : "Connect Wallet"}
                </button>
                <form className="bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4">
                    <h3 className="text-center font-bold text-purple-500 mb-8">Upload your NFT to the marketplace</h3>
                    <div className="mb-4">
                        <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="name">NFT Name</label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="name"
                            type="text"
                            placeholder="Axie#4563"
                            onChange={e => updateFormParams({ ...formParams, name: e.target.value })}
                            value={formParams.name}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="description">NFT Description</label>
                        <textarea
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            cols="40"
                            rows="5"
                            id="description"
                            placeholder="Axie Infinity Collection"
                            value={formParams.description}
                            onChange={e => updateFormParams({ ...formParams, description: e.target.value })}
                        ></textarea>
                    </div>
                    <div className="mb-6">
                        <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="price">Price (in ETH)</label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="number"
                            placeholder="Min 0.01 ETH"
                            step="0.01"
                            value={formParams.price}
                            onChange={e => updateFormParams({ ...formParams, price: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="image">Upload Image (&lt;500 KB)</label>
                        <input type="file" onChange={OnChangeFile} />
                    </div>
                    <br />
                    <div className="text-red-500 text-center">{message}</div>
                    <button onClick={listNFT} className="font-bold mt-10 w-full bg-purple-500 text-white rounded p-2 shadow-lg" id="list-button">
                        List NFT
                    </button>
                </form>
            </div>
        </div>
    );
}

