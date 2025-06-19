// const { DataTypes } = require("sequelize");
// const { sequelize } = require(".");
// const { validate } = require("uuid");

module.exports = (sequelize,DataTypes)=>{
    const FeedsTable = sequelize.define("FeedsTable",{
     id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    postersId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
     username:{
            type:DataTypes.STRING,
            allowNull: false,
            validate:{
                notEmpty:true,
            }
        },
         profilePicture:{
            type:DataTypes.TEXT,
            allowNull: true,
            validate:{
                notEmpty:false,
            }
        },
        postText:{
            type:DataTypes.TEXT,
            allowNull:false,
            validate:{
                notEmpty:true
            }
        },
        location:{
            type:DataTypes.STRING,
            allowNull:true,
            validate:{
                notEmpty:false
            }
        },
        country:{
            type:DataTypes.STRING,
            allowNull:false,
            validate:{
                notEmpty:true
            }
        },
        region:{
            type:DataTypes.STRING,
            allowNull:false,
            validate:{
                notEmpty:true
            }
        },
        pic1:{
            type:DataTypes.STRING,
            allowNull:true,
            validate:{
                notEmpty:false
            }
        },
        pic2:{
            type:DataTypes.STRING,
            allowNull:true,
            validate:{
                notEmpty:false
            }
        },
        pic3:{
            type:DataTypes.STRING,
            allowNull:true,
            validate:{
                notEmpty:false
            }
        },
        pic4:{
            type:DataTypes.STRING,
            allowNull:true,
            validate:{
                notEmpty:false
            }
        },
        pic5:{
            type:DataTypes.STRING,
            allowNull:true,
            validate:{
                notEmpty:false
            }
        },
        video1:{
            type:DataTypes.STRING,
            allowNull:true,
            validate:{
                notEmpty:false
            }
        },
        video2:{
            type:DataTypes.STRING,
            allowNull:true,
            validate:{
                notEmpty:false
            }
        },
        cartegory:{
            type:DataTypes.STRING,
            allowNull:false,
            validate:{
                notEmpty:true,
            }
        },
        reports:{
            type:DataTypes.TEXT,
            allowNull:true,
            validate:{
                notEmpty:false
            }
        },
        isDeleted:{
              type: DataTypes.BOOLEAN,
              defaultValue: false,
            }
    

    }, {
    tableName: 'feeds',
    timestamps: true,
  });

return FeedsTable;
}