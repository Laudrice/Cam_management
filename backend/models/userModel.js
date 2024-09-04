  module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("user",{
        user_name:{
            type: DataTypes.STRING,
            allowNull: false
        },
        user_mail:{
            type: DataTypes.STRING,
            allowNull: false
        },
        user_type:{
            type: DataTypes.STRING,
            allowNull: false
        },
        user_pwd: {
            type: DataTypes.STRING,
            allowNull: false
        },
       
    });
    return User;
  }