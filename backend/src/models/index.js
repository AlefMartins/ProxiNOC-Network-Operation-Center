const User = require("./User")
const Group = require("./Group")
const UserGroup = require("./UserGroup")
const Device = require("./Device")
const AuditLog = require("./AuditLog")
const CommandLog = require("./CommandLog")
const LdapConfig = require("./LdapConfig")
const EmailConfig = require("./EmailConfig")
const SystemSetting = require("./SystemSetting")
//const DeviceGroup = require("./DeviceGroup")
//const SystemConfig = require("./SystemConfig")
//const Notification = require("./Notification")


  // Associação muitos-para-muitos entre User e Group
  // Especificar explicitamente as chaves estrangeiras para evitar duplicação
  User.belongsToMany(Group, {
    through: UserGroup,
    foreignKey: "userId",
    otherKey: "groupId",
  })

  Group.belongsToMany(User, {
    through: UserGroup,
    foreignKey: "groupId",
    otherKey: "userId",
  })

User.hasMany(AuditLog)
AuditLog.belongsTo(User)

User.hasMany(CommandLog)
CommandLog.belongsTo(User)

Device.hasMany(CommandLog)
CommandLog.belongsTo(Device)

module.exports = {
  User,
  Group,
  UserGroup,
  Device,
  AuditLog,
  CommandLog,
  LdapConfig,
  EmailConfig,
  SystemSetting,
  //DeviceGroup,
  //SystemConfig,
  //Notification
}

