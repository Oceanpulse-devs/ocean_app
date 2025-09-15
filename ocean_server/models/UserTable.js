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
        // OAuth fields - will be added when implementing OAuth
        // google_Id:{
        //     type:DataTypes.STRING,
        //     allowNull: true,
        //     validate:{
        //         notEmpty:false,
        //     }
        // },
        // facebook_Id:{
        //     type:DataTypes.STRING,
        //     allowNull: true,
        //     validate:{
        //         notEmpty:false,
        //     }
        // },
        fullName:{
            type:DataTypes.STRING,
            allowNull: false,
            validate:{
                notEmpty:true,
            }
        },
        username:{
            type:DataTypes.STRING,
            allowNull: true,
            unique: true,
            validate:{
                notEmpty:false,
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
        agreeTerms:{
            type:DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            validate:{
                notEmpty:false,
            }
        },
        // Profile fields
        profilePicture:{
            type:DataTypes.STRING,
            allowNull: true,
            validate:{
                notEmpty:false,
            }
        },
        coverPicture:{
            type:DataTypes.STRING,
            allowNull: true,
            validate:{
                notEmpty:false,
            }
        },
        bio:{
            type:DataTypes.TEXT,
            allowNull: true,
            validate:{
                notEmpty:false,
            }
        },
        location:{
            type:DataTypes.STRING,
            allowNull: true,
            validate:{
                notEmpty:false,
            }
        },
        website:{
            type:DataTypes.STRING,
            allowNull: true,
            validate:{
                notEmpty:false,
            }
        },
        lastActive:{
            type:DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
            validate:{
                notEmpty:false,
            }
        },
        accountType:{
            type:DataTypes.ENUM("admin","buyer","seller","pending-seller"),
            allowNull: false,
            defaultValue:"buyer",
            validate:{
                notEmpty:true,
            }
        },
        accountStatus:{
            type:DataTypes.ENUM("active","suspended","deactivated"),
            allowNull: false,
            defaultValue:"active",
            validate:{
                notEmpty:true,
            }
        },
        createdAt:{
            type:DataTypes.DATE,
            allowNull: true, // Allow null temporarily for existing users
            defaultValue: DataTypes.NOW,
            validate:{
                notEmpty:false, // Allow empty for existing users
            }
        },
        updatedAt:{
            type:DataTypes.DATE,
            allowNull: true, // Allow null temporarily for existing users
            defaultValue: DataTypes.NOW,
            validate:{
                notEmpty:false, // Allow empty for existing users
            }
        },
        
       
    },{
        tableName:'users',
        timestamps: true, // Enable automatic timestamp management
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    })



    return UserTable;
}