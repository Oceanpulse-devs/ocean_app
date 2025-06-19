const { DataTypes } = require("sequelize");
const { validate } = require("uuid");


//this is where the comment, likes and shares count is stored 
   module.exports = (sequelize , DataTypes)=>{
    const ShareStats = sequelize.define("ShareStats",{
        id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true,
        },
        feedId:{
            type:DataTypes.UUID,
            allowNull:false,
        },
        sharerId:{
            type:DataTypes.UUID,
            allowNull:false,
        },
        shareCount:{
            type:DataTypes.INTEGER,
            defaultValue: 0,
        },

    },{
    tableName: 'share_stats',
    timestamps: true,
    },)

return ShareStats
}