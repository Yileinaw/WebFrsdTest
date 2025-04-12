import { useUserStore } from '@/stores/modules/user';
// ... other imports

const userStore = useUserStore();
// ... existing setup code

async function handleFollow(userToFollow: UserPublicListData) {
    if (!userStore.isLoggedIn) {
        ElMessage.warning('请先登录');
        router.push('/login');
        return;
    }
    try {
        loadingFollowStatus[userToFollow.id] = true;
        await UserService.followUser(userToFollow.id);
        userToFollow.isFollowing = true;
        ElMessage.success(`已关注 @${userToFollow.username}`);
        // Update the profile owner's follower count if we are on their profile
        if (userData.value && userToFollow.id === userData.value.id) {
             userData.value.followerCount = (userData.value.followerCount ?? 0) + 1;
        }
        // Update the current user's following count in the store
        userStore.incrementFollowingCount();

    } catch (error: any) {
        ElMessage.error(error.message || '关注失败');
    } finally {
        loadingFollowStatus[userToFollow.id] = false;
    }
}

async function handleUnfollow(userToUnfollow: UserPublicListData) {
    if (!userStore.isLoggedIn) {
        // Should not happen as button shouldn't be visible, but good practice
        return;
    }
    try {
        loadingFollowStatus[userToUnfollow.id] = true;
        await UserService.unfollowUser(userToUnfollow.id);
        userToUnfollow.isFollowing = false;
        ElMessage.success(`已取消关注 @${userToUnfollow.username}`);
         // Update the profile owner's follower count if we are on their profile
        if (userData.value && userToUnfollow.id === userData.value.id) {
            userData.value.followerCount = Math.max(0, (userData.value.followerCount ?? 0) - 1);
        }
         // Update the current user's following count in the store
        userStore.decrementFollowingCount();

    } catch (error: any) {
        ElMessage.error(error.message || '取消关注失败');
    } finally {
        loadingFollowStatus[userToUnfollow.id] = false;
    }
}

// ... rest of the script setup 