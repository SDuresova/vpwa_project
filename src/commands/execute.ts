import { useChannels } from '../states/channels'
import type { CommandDefinition, CommandResult } from '../types/command'
import { commandDefinitions } from './definitions'
import { handlers } from './handlers'
import { parseCommand } from './parser'

const { getById, isJoined, isAdmin } = useChannels()

function checkRules(definition: CommandDefinition, channelId: number | null) {
      // command works outside the chann
      if (!definition.requiresJoined) return

      // needs to be member
      if (channelId === null || !isJoined(channelId)) {
            throw new Error('Join this channel before using this command.')
      }

      // only admin
      if (definition.adminOnly && !isAdmin(channelId)) {
            throw new Error(`/${definition.name} is available only to the channel administrator.`)
      }

      // only sort of type of channel -> /kick → public, /revoke → private
      if (definition.channelType && getById(channelId)?.type !== definition.channelType) {
            throw new Error(`/${definition.name} works only in ${definition.channelType} channels.`)
      }
}

export function executeCommand(input: string, channelId: number | null): CommandResult {
      const { name, args} = parseCommand(input); // parse command
      const command = commandDefinitions[name]; // get the definiton of command

      checkRules(command, channelId); // check if correct

      const result = handlers[name](args, {channelId: channelId}); // call the function

      return result; // result ready for layout interaction 
}

