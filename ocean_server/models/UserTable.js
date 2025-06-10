// const { v4: uuidv4 } = require('uuid');

// const id = uuidv4();
// console.log(id); // Example: '2c4b4f5a-50c9-4b2b-9509-dfc5a2f78a55'

module.exports = (sequelize, DataTypes) =>{
    const UserTable = sequelize.define("UserTable", {
        id:{
            primaryKey:true,
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            allowNull: false,
            validate:{
                notEmpty:true,
            }
        },
        fullName:{
            type:DataTypes.STRING,
            allowNull: false,
            validate:{
                notEmpty:true,
            }
        },
        username:{
            type:DataTypes.STRING,
            allowNull: false,
            validate:{
                notEmpty:true,
            }
        },
        email:{
            type:DataTypes.STRING,
            allowNull: false,
            validate:{
                notEmpty:true,
            }
        },
        password:{
            type:DataTypes.STRING,
            allowNull: false,
            validate:{
                notEmpty:true,
            }
        },
        accountType:{
            type:DataTypes.ENUM("admin","buyer","seller"),
            allowNull: false,
            defaultValue:"buyer",
            validate:{
                notEmpty:true,
            }
        },
        createdAt:{
            type:DataTypes.DATE,
            allowNull: false,
            validate:{
                notEmpty:true,
            }
        },
        
       
    },{
        tableName:'users'
    })

    return UserTable;
}