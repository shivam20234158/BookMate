import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router=express.Router();

const generateToken=(userId)=>{
    return jwt.sign({userId},process.env.JWT_SECRET,{
        expiresIn:"7d",
    });
}

router.post("/login",async (req,res)=>{
    try{
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({message:"All fields are required"});
        }

        //if already exists
        const user=await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"User does not exists"});
        }   
        //if password matches
        const isMatch=await user.comparePassword(password);
        if(!isMatch){
            return res.status(400).json({message:"Invalid credentials"});
        }

        //generate token
        const token=generateToken(user._id);

        res.status(200).json({
            message:"Login successful",
            token,
            user:{
                id:user._id,
                username:user.username,
                email:user.email,
                profileImage:user.profileImage,
                createdAt:user.createdAt,
            },
        })
    }
    catch(error){
        console.log("Error in /login:", error);
        res.status(500).json({message:"Server error"});
    }
});
router.post("/register",async (req,res)=>{
    try{
        const {email,username,password}=req.body;

        if(!email || !username || !password){
            //return means go back from this function as error occurs
            return res.status(400).json({message:"All fields are required"});
        }
        if(password.length<6){
            return res.status(400).json({message:"Password must be at least 6 characters"});
        }
        if(username.length<3){
            return res.status(400).json({message:"Username must be at least 3 characters"});
        }

        //check if already exists
        const existingEmail=await User.findOne({email});
        if(existingEmail){
            return res.status(400).json({message:"Email already registered"});
        }
        const existingUsername=await User.findOne({username});
        if(existingUsername){
            return res.status(400).json({message:"Username already taken"});
        }

        //random avatar
        const profileImage=`https://api.dicebear.com/9.x/shapes/svg?seed=${username}`;

        //now create user
        const newUser=new User({
            email,
            username,
            password,
            profileImage,
        });

        await newUser.save();

        const token=generateToken(newUser._id);

        res.status(201).json({
            message:"User registered successfully",
            token,
            user:{
                id:newUser._id,
                username:newUser.username,
                email:newUser.email,
                profileImage:newUser.profileImage,
                createdAt:newUser.createdAt,
            },
        });
    }
    catch(error){
        console.log("Error in /register:", error);
        res.status(500).json({message:"Server error"});
    }
});

export default router;