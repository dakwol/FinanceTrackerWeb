import type { WorkspaceUser } from "@/entities/user/model/types";
import { commonOwnerId, OwnerId } from "@/shared/model/finance";

const legacyOwnerLabels: Record<string, string> = {
  danya: "Даня (старые данные)",
  katya: "Катя (старые данные)",
};

export function getOwnerLabel(
  ownerId: OwnerId,
  users: WorkspaceUser[],
): string {
  if (ownerId === commonOwnerId) {
    return "Общие";
  }

  const user = users.find((currentUser) => currentUser.id === ownerId);

  if (user) {
    return user.name || user.email;
  }

  return legacyOwnerLabels[ownerId] ?? "Неизвестный пользователь";
}

export function createOwnerOptions(
  users: WorkspaceUser[],
  currentOwnerId?: OwnerId,
): { label: string; value: string }[] {
  const options = [
    { label: "Общие", value: commonOwnerId },
    ...users.map((user) => ({
      label: user.name ? `${user.name} · ${user.email}` : user.email,
      value: user.id,
    })),
  ];

  if (
    currentOwnerId &&
    !options.some((option) => option.value === currentOwnerId)
  ) {
    options.push({
      label: getOwnerLabel(currentOwnerId, users),
      value: currentOwnerId,
    });
  }

  return options;
}
