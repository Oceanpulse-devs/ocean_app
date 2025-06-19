const { DataTypes } = require("sequelize");
const { validate } = require("uuid");


//this is where the comment, likes and shares count is stored 
   module.exports = (sequelize , DataTypes)=>{
    const LikeStats = sequelize.define("LikeStats",{
        id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true,
        },
        feedId:{
            type:DataTypes.UUID,
            allowNull:false,
        },
        likerId:{
            type:DataTypes.UUID,
            allowNull:false,
        },
        likeCount:{
            type:DataTypes.INTEGER,
            defaultValue: 0,
        },

    },{
    tableName: 'like_stats',
    timestamps: true,
    },)

return LikeStats
   }