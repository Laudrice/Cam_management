const bcrypt = require('bcryptjs');
const db = require('../models');

const User = db.users;

const userDefault = async () => {
    const saltRounds = 10;
    const plainPassword = '1234'; 
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    try {
        await User.create({
            user_name: '1234',
            user_mail: '1234@example.com',
            user_type: 'admin',
            user_pwd: hashedPassword
        });
        console.log('User added successfully!');
    } catch (error) {
        console.error('Error adding user:', error);
    }
};

userDefault();