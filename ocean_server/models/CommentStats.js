const { DataTypes } = require("sequelize");
const { validate } = require("uuid");


//this is where the comment, likes and shares count is stored 
   module.exports = (sequelize , DataTypes)=>{
    const CommentStats = sequelize.define("CommentStats",{
        id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true,
        },
        feedId:{
            type:DataTypes.UUID,
            allowNull:false,
        },
        commenterId:{
            type:DataTypes.UUID,
            allowNull:false,
        },
        commentText:{
            type:DataTypes.TEXT,
            allowNull:false,
            validate:{
                notEmpty:true,
            },
        },
        username:{
            type:DataTypes.STRING,
            allowNull:false,
            validate:{
                notEmpty:true
            }
        },
        profilePicture:{
            type:DataTypes.TEXT,
            allowNull:false,
            validate:{
                notEmpty:true,
            }
        },

    },{
    tableName: 'comment_stats',
    timestamps: true,
    },)

  return CommentStats
   }


