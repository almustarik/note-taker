import { useState, type FormEvent } from 'react';
import { api, type InterestGroup, type User } from '../api';
import Avatar from '../components/Avatar';
import Pager from '../components/Pager';
import { usePaged } from '../components/usePaged';

interface InterestsPageProps {
  user: User;
  onUserChange: (updatedUser: User) => void;
  onSelectUser: (selectedUserId: string) => void;
}

const parseCommaSeparatedInterestTags = (rawCommaString: string): string[] =>
  rawCommaString
    .split(',')
    .map((tagSegment) => tagSegment.trim())
    .filter(Boolean);

export default function InterestsPage({
  user: currentUser,
  onUserChange,
  onSelectUser,
}: InterestsPageProps) {
  const [searchFilterInputValue, setSearchFilterInputValue] = useState<string>('');
  const [activeSelectedFilterTag, setActiveSelectedFilterTag] = useState<string>('');
  const {
    result: aggregatedInterestGroupsResult,
    error: interestsFetchErrorMessage,
    setPage: setInterestsCurrentPage,
    reload: reloadInterestsData,
  } = usePaged<InterestGroup>(
    activeSelectedFilterTag
      ? `/users/interests?interest=${encodeURIComponent(activeSelectedFilterTag)}`
      : '/users/interests',
  );

  const [userInterestsInputValue, setUserInterestsInputValue] = useState<string>(
    currentUser.interests.join(', '),
  );
  const [isUserInterestsSaved, setIsUserInterestsSaved] = useState<boolean>(false);
  const [saveInterestsErrorMessage, setSaveInterestsErrorMessage] = useState<string>('');

  async function handleSaveUserInterestsSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const parsedTags = parseCommaSeparatedInterestTags(userInterestsInputValue);
      const updatedUser = await api.patch<User>('/auth/me', { interests: parsedTags });
      onUserChange(updatedUser);
      setUserInterestsInputValue(updatedUser.interests.join(', '));
      setIsUserInterestsSaved(true);
      setSaveInterestsErrorMessage('');
      await reloadInterestsData();
    } catch (caughtError) {
      setSaveInterestsErrorMessage((caughtError as Error).message);
    }
  }

  function handleApplyInterestTagFilter(selectedInterestTag: string) {
    setSearchFilterInputValue(selectedInterestTag);
    setActiveSelectedFilterTag(parseCommaSeparatedInterestTags(selectedInterestTag).join(','));
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Interests</h1>
          <p className="subtitle">See who likes what, and find people with the same hobbies.</p>
        </div>
      </header>

      <form className="panel mine" onSubmit={handleSaveUserInterestsSubmit}>
        <label htmlFor="my-interests">Your interests</label>
        <div className="mine-row">
          <input
            id="my-interests"
            value={userInterestsInputValue}
            onChange={(event) => {
              setUserInterestsInputValue(event.target.value);
              setIsUserInterestsSaved(false);
            }}
            placeholder="chess, reading, hiking"
          />
          <button className="button primary" disabled={isUserInterestsSaved}>
            {isUserInterestsSaved ? 'Saved' : 'Save'}
          </button>
        </div>
        {currentUser.interests.length > 0 && (
          <div className="tags">
            {currentUser.interests.map((interestTag) => (
              <button
                type="button"
                key={interestTag}
                className="tag hl"
                onClick={() => handleApplyInterestTagFilter(interestTag)}
                title={`Show only ${interestTag}`}
              >
                {interestTag}
              </button>
            ))}
          </div>
        )}
        {saveInterestsErrorMessage && <p className="error">{saveInterestsErrorMessage}</p>}
      </form>

      <form
        className="search"
        onSubmit={(event) => {
          event.preventDefault();
          handleApplyInterestTagFilter(searchFilterInputValue);
        }}
      >
        <input
          type="search"
          value={searchFilterInputValue}
          onChange={(event) => setSearchFilterInputValue(event.target.value)}
          placeholder="Filter by interest, e.g. chess, reading"
        />
        <button className="button ghost">Filter</button>
        {activeSelectedFilterTag && (
          <button
            type="button"
            className="link"
            onClick={() => handleApplyInterestTagFilter('')}
          >
            Clear
          </button>
        )}
      </form>

      {interestsFetchErrorMessage && <p className="error">{interestsFetchErrorMessage}</p>}
      {aggregatedInterestGroupsResult && aggregatedInterestGroupsResult.data.length === 0 && (
        <div className="empty">
          <p className="empty-title">Nothing here</p>
          <p>
            Nobody has listed{' '}
            {activeSelectedFilterTag ? 'these interests' : 'any interests'} yet.
          </p>
        </div>
      )}

      <div className="groups">
        {aggregatedInterestGroupsResult?.data.map((interestGroupItem) => (
          <article key={interestGroupItem.interest} className="group">
            <div className="group-head">
              <h3>
                <mark
                  className={
                    currentUser.interests.includes(interestGroupItem.interest) ? 'hl' : undefined
                  }
                >
                  {interestGroupItem.interest}
                </mark>
              </h3>
              <span className="count">{interestGroupItem.count}</span>
            </div>
            <div className="people">
              {interestGroupItem.users.map((memberUser) => (
                <button
                  key={memberUser._id}
                  className="person"
                  onClick={() => onSelectUser(memberUser._id)}
                  title={`See ${memberUser.name}'s posts`}
                >
                  <Avatar name={memberUser.name} size="sm" />
                  {memberUser._id === currentUser._id ? 'You' : memberUser.name}
                </button>
              ))}
              {interestGroupItem.count > interestGroupItem.users.length && (
                <span className="muted small">
                  +{interestGroupItem.count - interestGroupItem.users.length} more
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      {aggregatedInterestGroupsResult && (
        <Pager
          pagination={aggregatedInterestGroupsResult.pagination}
          onChange={setInterestsCurrentPage}
        />
      )}
    </section>
  );
}
