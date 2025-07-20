import React, { useState} from 'react';
import { useNavigate } from 'react-router-dom';

function SignIn() {
    const [secretKey, setSecretKey] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [region, setRegion] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('https://aws-manipulator.netlify.app/.netlify/functions/server/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    accessKey,
                    secretKey,
                    region
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error);
            }

            const data = await response.json();

            //process data
            const tempArray = data.buckets.map((element: { Name: any }) => {
                return {
                    name: element.Name
                    };
            });

            navigate('/home', {
                state : {
                    bucketList: tempArray
                }
            })
        } catch (err) {
            console.error(err);
        }
    };

    return(
        <>
            <div className="bg-amber-100 h-screen w-screen flex flex-col justify-center">
                <h2 className="text-center text-5xl font-bold pb-10">Sign In</h2>
                <form onSubmit={handleSubmit} className="flex flex-col items-center">
                    <div className="mb-4">
                        <label htmlFor="secretKey" className="block text-sm font-medium">Secret Key:</label>
                        <div className= "shadow-amber-800">
                            <input
                                type="password"
                                id="secretKey"
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="accessKey" className="block text-sm font-medium">Access Key:</label>
                        <input
                            type="password"
                            id="accessKey"
                            value={accessKey}
                            onChange={(e) => setAccessKey(e.target.value)}
                            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="region" className="block text-sm font-medium">Region:</label>
                        <input
                            type="text"
                            id="region"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                            required
                        />
                    </div>
                    <button type="submit" className="bg-amber-800 text-white p-2 rounded">
                        Submit
                    </button>
                </form>
            </div>
        </>
    )
}

export default SignIn