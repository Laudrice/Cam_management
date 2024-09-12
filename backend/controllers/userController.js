require('dotenv').config();

const { where } = require('sequelize')
const db = require('../models')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const secretKey = process.env.SECRET_KEY

// Create main Model
const User = db.users
const Cam = db.cams

// Main

// Create user
const addUser = async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.user_pwd, 10)
    let info = {
        user_name: req.body.user_name,
        user_mail: req.body.user_mail,
        user_type: req.body.user_type,
        user_pwd: hashedPassword
    }

    const user = await User.create(info)
    res.status(200).send(user)
    console.log(user)
}

// Get all users
const getAllUsers = async (req, res) => {
    let users = await User.findAll({})
    res.status(200).send(users)
}

// Get one user
const getOneUser = async (req, res) => {
    let id = req.params.id
    let user = await User.findOne({ where: { id: id } })
    res.status(200).send(user)
}

// Update user
const updateUser = async (req, res) => {
    let id = req.params.id
    const user = await User.update(req.body, { where: { id: id } })
    res.status(200).send(user)
}

// Delete user
const deleteUser = async (req, res) => {
    let id = req.params.id
    await User.destroy({ where: { id: id } })
    res.status(200).send('Utilisateur supprimé')
}

// Update user password
const updateUserPassword = async (req, res) => {
    let id = req.params.id
    const { old_password, new_password } = req.body
    
    // Selct user
    const user = await User.findOne({ where: { id: id } })
    if (!user) {
        return res.status(404).send('Utilisateur non trouvé')
    }

    // chk pwd
    const isMatch = await bcrypt.compare(old_password, user.user_pwd)
    if (!isMatch) {
        return res.status(400).send('Ancien mot de passe incorrect')
    }

    // hash pwd
    const hashedPassword = await bcrypt.hash(new_password, 10)
    await User.update({ user_pwd: hashedPassword }, { where: { id: id } })
    
    res.status(200).send('Mot de passe mis à jour')
}

// Login
const loginUser = async (req, res) => {
    const { user_mail, user_pwd } = req.body;
    if (!user_mail || !user_pwd) {
        return res.status(400).send('Mail et mot de passe requis');
    }

    const user = await User.findOne({ where: { user_mail } });
    if (!user) {
        return res.status(404).send('Utilisateur non trouvé');
    }

    const isMatch = await bcrypt.compare(user_pwd, user.user_pwd);
    if (!isMatch) {
        return res.status(400).send('Mot de passe incorrect');
    }

    const token = jwt.sign({ id: user.id, user_mail: user.user_mail }, secretKey, { expiresIn: '2h' });
    res.status(200).send({ token });
};

// vérifier le token
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).send('Accès refusé');

    try {
        const verified = jwt.verify(token, secretKey);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Token invalide');
    }
};

// Logout
const logoutUser = (req, res) => {
    res.status(200).send('Déconnexion réussie');
};

module.exports = {
    addUser,
    getAllUsers,
    getOneUser,
    updateUser,
    deleteUser,
    updateUserPassword,
    loginUser,
    authenticateToken,
    logoutUser
};
