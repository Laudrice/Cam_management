module.exports = (sequelize, DataTypes) => {
    const Cam = sequelize.define("cam", {
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        enabled: {
            type: DataTypes.STRING,
            allowNull: false
        },
        transport: {
            type: DataTypes.STRING,
            allowNull: false
        },
        nom_: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });
    return Cam;
};
