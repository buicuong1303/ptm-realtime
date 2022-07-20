import * as moment from 'moment';

export const checkExpirationToken = (expValue: number) => {
  return (
    expValue < moment(new Date()).add(4, 'm').add(30, 's').valueOf() / 1000
  );
};
