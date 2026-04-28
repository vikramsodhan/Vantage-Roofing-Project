'use client'

import { useTransition } from 'react'
import { updateRole, toggleActive } from '../actions'
import type { Profile, Role } from '@/types'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

interface UserTableProps {
  users: Profile[]
  currentUserId: string
}

export default function UserTable({ users, currentUserId }: UserTableProps) {
  return (
    <div>
      <h2 className="text-lg font-medium mb-3">Users</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <UserRow
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function UserRow({ user, isSelf }: { user: Profile; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition()

  function handleRoleChange(role: string) {
    startTransition(() => updateRole(user.id, role as Role))
  }

  function handleActiveToggle(checked: boolean) {
    startTransition(() => toggleActive(user.id, checked))
  }

  return (
    <TableRow className={isPending ? 'opacity-50 pointer-events-none' : ''}>
      <TableCell>{user.full_name}</TableCell>
      <TableCell>
        <Select
          defaultValue={user.role ?? 'employee'}
          onValueChange={handleRoleChange}
          disabled={isSelf || isPending}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={user.is_active ?? true}
            onCheckedChange={handleActiveToggle}
            disabled={isSelf || isPending}
          />
          <Badge variant={user.is_active ? 'default' : 'secondary'}>
            {user.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </TableCell>
    </TableRow>
  )
}