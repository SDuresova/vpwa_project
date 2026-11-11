import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('channel_members', (table) => {
      table.integer('last_read_message_id').unsigned().notNullable().defaultTo(0)
    })
    // Existing history starts read when this feature is installed.
    this.defer(async (db) => {
      await db.rawQuery(`UPDATE channel_members cm SET last_read_message_id =
        COALESCE((SELECT MAX(m.id) FROM messages m WHERE m.channel_id = cm.channel_id), 0)`)
    })
  }

  async down() {
    this.schema.alterTable('channel_members', (table) => table.dropColumn('last_read_message_id'))
  }
}
