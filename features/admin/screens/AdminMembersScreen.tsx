import { testIds } from '@/constants/testIds';
import { AdminEntityListScreen } from '@/features/admin/components/AdminEntityListScreen';
import { useMembers } from '@/features/members';

export default function AdminMembersScreen() {
  const query = useMembers();

  return (
    <AdminEntityListScreen
      screenTestId={testIds.admin.members.screen}
      title="Members"
      subtitle="Create and maintain congregation members"
      addLabel="Add member"
      addTestId={testIds.admin.members.add}
      addRoute="/admin/members/new"
      query={query}
      getItemName={(member) => member.full_name}
      getItemMeta={(member) => `${member.status} · ${member.risk_level} risk`}
      getItemRoute={(member) => `/admin/members/${member.id}`}
      getItemTestId={(member) => testIds.admin.members.item(member.id)}
    />
  );
}
